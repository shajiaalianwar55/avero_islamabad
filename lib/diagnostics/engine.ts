import {
  DEFAULT_ENGINE_CONFIG,
  type AnswerOption,
  type AnswerRecord,
  type DiagnosticKnowledgeBase,
  type DiagnosticQuestion,
  type DiagnosticResult,
  type DiagnosticSession,
  type EngineConfig,
  type Hypothesis,
  type HypothesisId,
  type PathOutcome,
  type QuestionCondition,
  type StepResult,
  type SymptomIntake,
} from "./types";

function cloneScores(scores: Record<string, number>) {
  return { ...scores };
}

export function createSession(
  kb: DiagnosticKnowledgeBase,
  configOverrides?: Partial<EngineConfig>
): DiagnosticSession {
  const config: EngineConfig = {
    ...DEFAULT_ENGINE_CONFIG,
    ...kb.config,
    ...configOverrides,
  };
  const scores: Record<string, number> = {};
  for (const h of kb.hypotheses) {
    scores[h.id] = h.prior;
  }
  return {
    kbId: kb.id,
    domain: kb.domain,
    scores,
    asked: [],
    answers: [],
    safety: { emergency: false, caution: false, reasons: [] },
    config,
  };
}

/** Seed scores + safety from Problem intake — appliance alone does not pick questions. */
export function createSessionFromIntake(
  kb: DiagnosticKnowledgeBase,
  intake: SymptomIntake,
  configOverrides?: Partial<EngineConfig>
): DiagnosticSession {
  const session = createSession(kb, configOverrides);
  for (const [id, delta] of Object.entries(intake.hypothesisBoosts)) {
    session.scores[id] = (session.scores[id] ?? 0) + delta;
  }
  if (intake.safety.emergency) {
    session.safety.emergency = true;
    if (intake.safety.reason) session.safety.reasons.push(intake.safety.reason);
  }
  if (intake.safety.caution) {
    session.safety.caution = true;
    if (intake.safety.reason && !session.safety.reasons.includes(intake.safety.reason)) {
      session.safety.reasons.push(intake.safety.reason);
    }
  }
  session.intake = intake;
  session.answers = [
    {
      questionId: "symptom_intake",
      optionId: intake.family,
      prompt: "What's happening?",
      label: intake.rawText,
    },
  ];
  return session;
}

function hazardHypothesesActive(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): boolean {
  return activeHypotheses(kb, session).some((a) => {
    const id = a.hypothesis.id;
    return (
      id.includes("fire") ||
      id.includes("electrical_hazard") ||
      id.includes("water_near") ||
      id.includes("hazard")
    );
  });
}

function isQuestionSuppressed(
  q: DiagnosticQuestion,
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): boolean {
  const suppressed = session.intake?.suppressedTags ?? [];
  if (!suppressed.length || !q.tags?.length) return false;
  if (!q.tags.some((t) => suppressed.includes(t))) return false;
  if (session.safety.emergency) return false;
  if (hazardHypothesesActive(kb, session)) return false;
  return true;
}

function tagAffinity(q: DiagnosticQuestion, session: DiagnosticSession): number {
  const preferred = session.intake?.preferredTags ?? [];
  if (!preferred.length || !q.tags?.length) return 0;
  let hit = 0;
  for (const t of q.tags) {
    if (preferred.includes(t)) hit += 1;
  }
  return hit * 1.25;
}

function wantsSafetyQuestions(session: DiagnosticSession, kb: DiagnosticKnowledgeBase): boolean {
  if (session.safety.emergency) return true;
  const preferred = session.intake?.preferredTags ?? [];
  if (preferred.some((t) => t.startsWith("safety_"))) return true;
  if (hazardHypothesesActive(kb, session)) return true;
  return false;
}

export function rankedHypotheses(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): Array<{ hypothesis: Hypothesis; score: number }> {
  return kb.hypotheses
    .map((hypothesis) => ({
      hypothesis,
      score: session.scores[hypothesis.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Hypotheses still competitive with the leader. */
export function activeHypotheses(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): Array<{ hypothesis: Hypothesis; score: number }> {
  const ranked = rankedHypotheses(kb, session);
  if (ranked.length === 0) return [];
  const leader = ranked[0].score;
  const floor = Math.max(leader * session.config.activeRatio, leader - 4);
  return ranked.filter((r) => r.score >= floor);
}

function answerMatches(
  session: DiagnosticSession,
  questionId: string,
  optionIds: string[]
): boolean {
  const found = session.answers.find((a) => a.questionId === questionId);
  if (!found) return false;
  return optionIds.includes(found.optionId);
}

export function evaluateConditions(
  conditions: QuestionCondition | undefined,
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): boolean {
  if (!conditions) return true;

  if (conditions.minAsked != null && session.asked.length < conditions.minAsked) {
    return false;
  }
  if (conditions.maxAsked != null && session.asked.length >= conditions.maxAsked) {
    return false;
  }

  const active = activeHypotheses(kb, session);
  const activeIds = new Set(active.map((a) => a.hypothesis.id));

  if (conditions.anyActiveHypothesis?.length) {
    if (!conditions.anyActiveHypothesis.some((id) => activeIds.has(id))) return false;
  }
  if (conditions.allActiveHypothesis?.length) {
    if (!conditions.allActiveHypothesis.every((id) => activeIds.has(id))) return false;
  }
  if (conditions.requireAnswer) {
    if (
      !answerMatches(
        session,
        conditions.requireAnswer.questionId,
        conditions.requireAnswer.optionIds
      )
    ) {
      return false;
    }
  }
  if (conditions.forbidAnswer) {
    if (
      answerMatches(
        session,
        conditions.forbidAnswer.questionId,
        conditions.forbidAnswer.optionIds
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * How well would this question split the current top hypotheses?
 * Higher = better differentiator. Deterministic; no LLM.
 */
export function questionUtility(
  question: DiagnosticQuestion,
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): number {
  const ranked = rankedHypotheses(kb, session);
  const top = ranked.slice(0, session.config.topK);
  if (top.length < 2) {
    // Still useful if it can confirm/deny the leader strongly
    if (top.length === 1) {
      let amp = 0;
      for (const opt of question.options) {
        for (const e of opt.effects) {
          if (e.hypothesisId === top[0].hypothesis.id) amp += Math.abs(e.delta);
        }
      }
      return amp * 0.25;
    }
    return 0;
  }

  const topIds = new Set(top.map((t) => t.hypothesis.id));
  let util = 0;

  for (const opt of question.options) {
    const deltas = top.map((t) => {
      const hit = opt.effects.find((e) => e.hypothesisId === t.hypothesis.id);
      return hit?.delta ?? 0;
    });
    const mean = deltas.reduce((s, d) => s + d, 0) / deltas.length;
    const variance =
      deltas.reduce((s, d) => s + (d - mean) * (d - mean), 0) / deltas.length;

    // Bonus if options push hypotheses in opposite directions
    const spread = Math.max(...deltas) - Math.min(...deltas);

    // Count how many top hyps this option actually touches
    const touched = opt.effects.filter((e) => topIds.has(e.hypothesisId)).length;

    util += variance + spread * 0.5 + touched * 0.15;
  }

  // Prefer questions that touch more of the active set
  const activeTouch = question.options.reduce((n, opt) => {
    return n + opt.effects.filter((e) => topIds.has(e.hypothesisId)).length;
  }, 0);

  const priorityBoost = 1 + (10 - Math.min(question.priority ?? 5, 10)) * 0.02;
  return (util / question.options.length + activeTouch * 0.05) * priorityBoost;
}

export function eligibleQuestions(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): DiagnosticQuestion[] {
  const asked = new Set(session.asked);
  return kb.questions.filter(
    (q) =>
      !asked.has(q.id) &&
      evaluateConditions(q.conditions, kb, session) &&
      !isQuestionSuppressed(q, kb, session)
  );
}

export function selectNextQuestion(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): DiagnosticQuestion | null {
  const candidates = eligibleQuestions(kb, session);
  if (candidates.length === 0) return null;

  const allowSafetyBoost = wantsSafetyQuestions(session, kb);

  let best: DiagnosticQuestion | null = null;
  let bestUtil = -1;

  for (const q of candidates) {
    const isSafetyQ = q.tags?.some((t) => t.startsWith("safety_")) ||
      q.options.some((o) => o.safety?.emergency);
    // Do NOT force generic hazard questions — only boost when intake/evidence warrants it
    const safetyBoost = allowSafetyBoost && isSafetyQ ? 1.5 : 0;
    // Mildly penalize irrelevant safety questions even if not fully suppressed
    const safetyPenalty =
      session.intake && !allowSafetyBoost && isSafetyQ ? -3 : 0;
    const u =
      questionUtility(q, kb, session) + tagAffinity(q, session) + safetyBoost + safetyPenalty;
    if (u > bestUtil) {
      bestUtil = u;
      best = q;
    } else if (u === bestUtil && best) {
      const bp = best.priority ?? 5;
      const qp = q.priority ?? 5;
      if (qp < bp || (qp === bp && q.id < best.id)) best = q;
    }
  }

  if (!best) return null;

  const rawUtil = questionUtility(best, kb, session) + tagAffinity(best, session);
  if (rawUtil < session.config.minUtility) {
    if (session.asked.length === 0) return best;
    if ((best.priority ?? 5) <= 2) return best;
    if (allowSafetyBoost && best.tags?.some((t) => t.startsWith("safety_"))) return best;
    return rawUtil >= session.config.minUtility * 0.5 ? best : null;
  }
  return best;
}

function applyOptionToScores(
  scores: Record<HypothesisId, number>,
  option: AnswerOption
): Record<HypothesisId, number> {
  const next = cloneScores(scores);
  for (const e of option.effects) {
    next[e.hypothesisId] = (next[e.hypothesisId] ?? 0) + e.delta;
  }
  return next;
}

export function applyAnswer(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession,
  question: DiagnosticQuestion,
  optionId: string
): DiagnosticSession {
  const option = question.options.find((o) => o.id === optionId);
  if (!option) {
    throw new Error(`Unknown option ${optionId} for question ${question.id}`);
  }

  const scores = applyOptionToScores(session.scores, option);
  const safety = {
    emergency: session.safety.emergency,
    caution: session.safety.caution,
    reasons: [...session.safety.reasons],
  };

  if (option.safety?.emergency) {
    safety.emergency = true;
    if (option.safety.reason) safety.reasons.push(option.safety.reason);
  }
  if (option.safety?.caution) {
    safety.caution = true;
    if (option.safety.reason) safety.reasons.push(option.safety.reason);
  }

  const record: AnswerRecord = {
    questionId: question.id,
    optionId: option.id,
    prompt: question.prompt,
    label: option.label,
  };

  return {
    ...session,
    scores,
    asked: [...session.asked, question.id],
    answers: [...session.answers, record],
    safety,
  };
}

function buildExplanation(
  outcome: PathOutcome,
  top: Hypothesis | null,
  ranked: Array<{ hypothesis: Hypothesis; score: number }>,
  reason: DiagnosticResult["reason"],
  safetyReasons: string[]
): string {
  if (outcome === "EMERGENCY") {
    return (
      safetyReasons[0] ||
      "Safety signals mean you should stop DIY and treat this as an emergency."
    );
  }
  const leader = top?.summary || "We need a technician to inspect this safely.";
  const runner = ranked[1]?.hypothesis.label;
  if (reason === "confident" && top) {
    return runner
      ? `Most likely: ${leader} (more likely than ${runner.toLowerCase()}).`
      : `Most likely: ${leader}`;
  }
  if (reason === "max_questions" || reason === "no_useful_questions") {
    return `Based on what we could observe: ${leader} A technician is safer if you're unsure.`;
  }
  return leader;
}

export function finalize(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession,
  reason: DiagnosticResult["reason"]
): DiagnosticResult {
  if (session.safety.emergency || reason === "emergency") {
    const ranked = rankedHypotheses(kb, session);
    return {
      stopped: true,
      reason: "emergency",
      outcome: "EMERGENCY",
      topHypothesis: ranked[0]?.hypothesis ?? null,
      ranked,
      answers: session.answers,
      diySteps: [],
      explanation: buildExplanation(
        "EMERGENCY",
        ranked[0]?.hypothesis ?? null,
        ranked,
        "emergency",
        session.safety.reasons
      ),
    };
  }

  const ranked = rankedHypotheses(kb, session);
  const top = ranked[0]?.hypothesis ?? null;
  let outcome: PathOutcome = top?.path ?? "TECHNICIAN";

  // Soft caution with weak DIY → prefer technician
  if (outcome === "DIY" && session.safety.caution) {
    outcome = "TECHNICIAN";
  }

  return {
    stopped: true,
    reason,
    outcome,
    topHypothesis: top,
    ranked,
    answers: session.answers,
    diySteps: outcome === "DIY" ? top?.diySteps ?? [] : [],
    explanation: buildExplanation(
      outcome,
      top,
      ranked,
      reason,
      session.safety.reasons
    ),
  };
}

export function shouldStop(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): DiagnosticResult["reason"] | null {
  if (session.safety.emergency) return "emergency";

  if (session.asked.length >= session.config.maxQuestions) return "max_questions";

  const ranked = rankedHypotheses(kb, session);
  if (ranked.length === 0) return "no_useful_questions";

  const leader = ranked[0];
  const second = ranked[1];
  const margin = second ? leader.score - second.score : leader.score;

  if (
    session.asked.length >= session.config.minQuestionsForConfidence &&
    leader.score >= session.config.minLeaderScore &&
    margin >= session.config.confidenceMargin
  ) {
    return "confident";
  }

  const next = selectNextQuestion(kb, session);
  if (!next) return "no_useful_questions";

  return null;
}

/** Start or continue: returns next question or a final result. */
export function nextStep(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession
): StepResult {
  const stop = shouldStop(kb, session);
  // Don't stop for "confident" before any questions — ask at least one
  if (stop && !(stop === "confident" && session.asked.length === 0)) {
    return finalize(kb, session, stop);
  }

  const question = selectNextQuestion(kb, session);
  if (!question) {
    return finalize(kb, session, "no_useful_questions");
  }

  return {
    stopped: false,
    question,
    session,
    activeHypotheses: activeHypotheses(kb, session),
  };
}

/** Convenience: answer current question and immediately compute next step. */
export function answerAndContinue(
  kb: DiagnosticKnowledgeBase,
  session: DiagnosticSession,
  question: DiagnosticQuestion,
  optionId: string
): StepResult {
  const updated = applyAnswer(kb, session, question, optionId);
  return nextStep(kb, updated);
}

/** Run a scripted path of option ids (for tests). */
export function runScripted(
  kb: DiagnosticKnowledgeBase,
  optionIds: string[],
  configOverrides?: Partial<EngineConfig>
): DiagnosticResult {
  let session = createSession(kb, configOverrides);
  for (const optionId of optionIds) {
    const step = nextStep(kb, session);
    if (step.stopped) return step;
    const opt =
      step.question.options.find((o) => o.id === optionId) ||
      // allow answering by matching option id globally on this question only
      step.question.options.find((o) => o.id === optionId);
    if (!opt) {
      // try to find optionId among current question — if missing, pick unsure if present
      const unsure = step.question.options.find(
        (o) => o.id.includes("unsure") || o.label.toLowerCase().includes("not sure")
      );
      if (!unsure) {
        throw new Error(
          `Scripted option ${optionId} not on question ${step.question.id} (${step.question.options.map((o) => o.id).join(", ")})`
        );
      }
      session = applyAnswer(kb, session, step.question, unsure.id);
    } else {
      session = applyAnswer(kb, session, step.question, opt.id);
    }
  }
  // Keep asking with... we need a different API for tests that picks by strategy.
  // Finalize after scripted answers even if more questions remain.
  const stop = shouldStop(kb, session) || "confident";
  return finalize(kb, session, stop === "emergency" ? "emergency" : stop);
}

/**
 * Answer by walking the tree: at each step pick the option whose id is in `preferred`
 * or whose id matches a predicate. Used by fixtures.
 */
export function runWithChooser(
  kb: DiagnosticKnowledgeBase,
  choose: (q: DiagnosticQuestion) => string,
  configOverrides?: Partial<EngineConfig>
): DiagnosticResult {
  let session = createSession(kb, configOverrides);
  // Safety bound
  for (let i = 0; i < 24; i++) {
    const step = nextStep(kb, session);
    if (step.stopped) return step;
    const optionId = choose(step.question);
    session = applyAnswer(kb, session, step.question, optionId);
  }
  return finalize(kb, session, "max_questions");
}
