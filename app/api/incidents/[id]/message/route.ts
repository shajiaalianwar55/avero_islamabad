import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { parseIncidentIntake } from "@/lib/ai/intake";
import { planNextQuestion } from "@/lib/ai/question-planner";
import { classifySafety } from "@/lib/ai/safety-classifier";
import { classifyTriage } from "@/lib/ai/triage";
import { assessSafetyRules, mergeSafetyAssessments } from "@/lib/safety/rules";
import {
  addMessage,
  getIncident,
  getLatestTriageDecision,
  listMessages,
  saveSafetyAssessment,
  saveTriageDecision,
  updateIncidentStatus,
} from "@/lib/db/incidents";

const bodySchema = z.object({
  content: z.string().min(1),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be JSON");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body");
  }

  const incident = await getIncident(id);
  if (!incident) return fail("NOT_FOUND", "Incident not found", 404);

  try {
    const userMessage = await addMessage({
      incident_id: id,
      role: "user",
      content: parsed.data.content,
    });

    const allText = `${incident.initial_description}\n${parsed.data.content}`;
    const rules = assessSafetyRules(allText);
    const aiSafety = await classifySafety(allText);
    const safety = mergeSafetyAssessments(rules, aiSafety);

    await saveSafetyAssessment({
      incident_id: id,
      level: safety.level,
      hazard_codes: safety.hazard_codes,
      stop_troubleshooting: safety.stop_troubleshooting,
      safe_actions: safety.safe_immediate_actions,
      prohibited_actions: safety.prohibited_actions,
    });

    if (safety.stop_troubleshooting || safety.level === "emergency") {
      const decision = await classifyTriage({
        description: incident.initial_description,
        messages: [{ role: "user", content: parsed.data.content }],
        safety,
      });

      await saveTriageDecision({
        incident_id: id,
        outcome: "EMERGENCY",
        likely_issue: decision.likely_issue,
        confidence: decision.confidence,
        observed_facts: decision.observed_facts,
        concerns: decision.concerns,
        recommended_next_step: decision.recommended_next_step,
        technician_trade: decision.technician_trade ?? "electrical",
      });
      await updateIncidentStatus(id, "EMERGENCY");

      const assistantMessage = await addMessage({
        incident_id: id,
        role: "assistant",
        content:
          "Emergency override: stop troubleshooting. " +
          safety.safe_immediate_actions.slice(0, 3).join(" "),
        metadata: { kind: "emergency", safety, decision },
      });

      return ok({
        message: userMessage,
        assistantMessage,
        safety,
        decision: { ...decision, outcome: "EMERGENCY" as const },
        done: true,
      });
    }

    const messages = await listMessages(id);
    const priorQuestions = messages
      .filter((m) => m.role === "assistant" && m.metadata?.kind === "question")
      .map((m) => m.content);
    const priorAnswers = messages
      .filter((m) => m.role === "user")
      .slice(1)
      .map((m) => m.content);

    const intake = await parseIncidentIntake(
      `${incident.initial_description}\n${priorAnswers.join("\n")}\n${parsed.data.content}`
    );

    const nextQuestion = await planNextQuestion({
      description: incident.initial_description,
      intake,
      priorQuestions,
      priorAnswers: [...priorAnswers, parsed.data.content],
      messageCount: messages.length + 1,
    });

    if (nextQuestion.should_ask && nextQuestion.question) {
      const assistantMessage = await addMessage({
        incident_id: id,
        role: "assistant",
        content: nextQuestion.question,
        metadata: { kind: "question", nextQuestion, safety, intake },
      });
      return ok({
        message: userMessage,
        assistantMessage,
        safety,
        nextQuestion,
        done: false,
      });
    }

    const decision = await classifyTriage({
      description: incident.initial_description,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      intake,
      safety,
    });

    await saveTriageDecision({
      incident_id: id,
      outcome: decision.outcome,
      likely_issue: decision.likely_issue,
      confidence: decision.confidence,
      observed_facts: decision.observed_facts,
      concerns: decision.concerns,
      recommended_next_step: decision.recommended_next_step,
      technician_trade: decision.technician_trade ?? null,
    });

    const status =
      decision.outcome === "DIY"
        ? "DIY_ACTIVE"
        : decision.outcome === "EMERGENCY"
          ? "EMERGENCY"
          : "TECHNICIAN_REQUIRED";
    await updateIncidentStatus(id, status);

    const assistantMessage = await addMessage({
      incident_id: id,
      role: "assistant",
      content: `${decision.outcome}: ${decision.likely_issue}. ${decision.recommended_next_step}`,
      metadata: { kind: "decision", decision, safety, intake },
    });

    const saved = await getLatestTriageDecision(id);

    return ok({
      message: userMessage,
      assistantMessage,
      safety,
      decision: saved ?? decision,
      nextQuestion,
      done: true,
    });
  } catch (err) {
    console.error(err);
    return fail("MESSAGE_FAILED", "Could not process message", 500);
  }
}
