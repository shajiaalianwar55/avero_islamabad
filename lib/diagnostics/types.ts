/**
 * Data-driven diagnostic engine types (Akinator / expert-system style).
 * Domains plug in hypotheses + observable questions; the engine scores and selects.
 */

export type RepairDomainId =
  | "plumbing"
  | "electrical"
  | "ac"
  | "appliance"
  | "geyser"
  | "water_pump"
  | "ups_inverter"
  | "solar"
  | "structural"
  | "generic";

export type PathOutcome = "DIY" | "TECHNICIAN" | "EMERGENCY";

export type HypothesisId = string;
export type QuestionId = string;
export type OptionId = string;

/** A possible explanation for the incident. */
export type Hypothesis = {
  id: HypothesisId;
  label: string;
  /** Plain-language homeowner summary */
  summary: string;
  /** Starting weight before any answers (default 1) */
  prior: number;
  /** What we recommend if this hypothesis wins (safety may override) */
  path: "DIY" | "TECHNICIAN";
  /** Optional DIY steps when this hypothesis wins DIY */
  diySteps?: Array<{ instruction: string; success_check: string }>;
};

export type HypothesisEffect = {
  hypothesisId: HypothesisId;
  /** Positive raises belief; negative lowers. Typical range −3…+3 */
  delta: number;
};

export type SafetyEffect = {
  /** Hard override → Emergency */
  emergency?: boolean;
  /** Soft caution tag (does not stop alone) */
  caution?: boolean;
  reason?: string;
};

export type AnswerOption = {
  id: OptionId;
  /** Everyday language — no jargon */
  label: string;
  effects: HypothesisEffect[];
  safety?: SafetyEffect;
};

/**
 * When is this question worth asking given current state?
 * All listed conditions must pass (AND). Empty = always eligible once unused.
 */
export type QuestionCondition = {
  /** At least one of these hypotheses is still "active" (competitive) */
  anyActiveHypothesis?: HypothesisId[];
  /** All of these hypotheses must still be active */
  allActiveHypothesis?: HypothesisId[];
  /** Require that a prior question was answered with one of these options */
  requireAnswer?: { questionId: QuestionId; optionIds: OptionId[] };
  /** Skip if a prior question was answered with one of these options */
  forbidAnswer?: { questionId: QuestionId; optionIds: OptionId[] };
  /** Only ask if we have already asked at least N questions */
  minAsked?: number;
  /** Only ask if fewer than N questions asked */
  maxAsked?: number;
};

export type DiagnosticQuestion = {
  id: QuestionId;
  /** Observable by a normal homeowner — no technical terms */
  prompt: string;
  options: AnswerOption[];
  /** Prefer asking earlier when multiple questions tie (lower = earlier) */
  priority?: number;
  conditions?: QuestionCondition;
};

export type DiagnosticKnowledgeBase = {
  id: string;
  domain: RepairDomainId;
  title: string;
  description: string;
  hypotheses: Hypothesis[];
  questions: DiagnosticQuestion[];
  /** Engine tuning overrides */
  config?: Partial<EngineConfig>;
};

export type EngineConfig = {
  /** Keep asking while leader is within this margin of #2 */
  confidenceMargin: number;
  /** Absolute score the leader must reach to stop early */
  minLeaderScore: number;
  /** Hypotheses within this fraction of the leader are "active" */
  activeRatio: number;
  /** Hard cap on questions */
  maxQuestions: number;
  /** Skip questions whose utility is below this */
  minUtility: number;
  /** How many leading hypotheses to optimize discrimination for */
  topK: number;
  /**
   * Do not stop for confidence until this many questions are answered
   * (emergency can still stop immediately).
   */
  minQuestionsForConfidence: number;
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  confidenceMargin: 2.5,
  minLeaderScore: 5,
  activeRatio: 0.55,
  maxQuestions: 14,
  minUtility: 0.35,
  topK: 4,
  minQuestionsForConfidence: 4,
};

export type AnswerRecord = {
  questionId: QuestionId;
  optionId: OptionId;
  prompt: string;
  label: string;
};

export type DiagnosticSession = {
  kbId: string;
  domain: RepairDomainId;
  scores: Record<HypothesisId, number>;
  asked: QuestionId[];
  answers: AnswerRecord[];
  safety: {
    emergency: boolean;
    caution: boolean;
    reasons: string[];
  };
  config: EngineConfig;
};

export type StopReason =
  | "emergency"
  | "confident"
  | "no_useful_questions"
  | "max_questions";

export type DiagnosticResult = {
  stopped: true;
  reason: StopReason;
  outcome: PathOutcome;
  topHypothesis: Hypothesis | null;
  ranked: Array<{ hypothesis: Hypothesis; score: number }>;
  answers: AnswerRecord[];
  diySteps: Array<{ instruction: string; success_check: string }>;
  explanation: string;
};

export type NextQuestionResult = {
  stopped: false;
  question: DiagnosticQuestion;
  session: DiagnosticSession;
  activeHypotheses: Array<{ hypothesis: Hypothesis; score: number }>;
};

export type StepResult = NextQuestionResult | DiagnosticResult;
