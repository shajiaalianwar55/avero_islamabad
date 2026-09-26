import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { parseIncidentIntake } from "@/lib/ai/intake";
import { planNextQuestion } from "@/lib/ai/question-planner";
import { classifySafety } from "@/lib/ai/safety-classifier";
import { classifyTriage } from "@/lib/ai/triage";
import { assessSafetyRules, mergeSafetyAssessments } from "@/lib/safety/rules";
import {
  addMessage,
  createIncident,
  getIncident,
  getLatestTriageDecision,
  listMessages,
  saveSafetyAssessment,
  saveTriageDecision,
  updateIncidentStatus,
} from "@/lib/db/incidents";
import { findRelevantHistory, getHome } from "@/lib/db/history";
import { DEMO_HOME_ID } from "@/lib/demo/store";

const bodySchema = z.object({
  description: z.string().min(3),
  home_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  area: z.string().optional(),
});

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("VALIDATION_ERROR", "id required");
  const incident = await getIncident(id);
  if (!incident) return fail("NOT_FOUND", "Incident not found", 404);
  const messages = await listMessages(id);
  const decision = await getLatestTriageDecision(id);
  return ok({ incident, messages, decision });
}

export async function POST(request: Request) {
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

  const { description, home_id, asset_id, area } = parsed.data;

  try {
    const intake = await parseIncidentIntake(description);
    const incident = await createIncident({
      home_id: home_id ?? DEMO_HOME_ID,
      asset_id: asset_id ?? null,
      initial_description: description,
      category_guess: intake.category_guess,
    });

    if (area) {
      const home = await getHome(incident.home_id);
      if (home) home.area = area;
    }

    await addMessage({
      incident_id: incident.id,
      role: "user",
      content: description,
      metadata: { kind: "initial" },
    });

    const rules = assessSafetyRules(description);
    const aiSafety = await classifySafety(description);
    const safety = mergeSafetyAssessments(rules, aiSafety);

    await saveSafetyAssessment({
      incident_id: incident.id,
      level: safety.level,
      hazard_codes: safety.hazard_codes,
      stop_troubleshooting: safety.stop_troubleshooting,
      safe_actions: safety.safe_immediate_actions,
      prohibited_actions: safety.prohibited_actions,
    });

    const history = await findRelevantHistory({
      homeId: incident.home_id,
      category: intake.category_guess,
      description,
    });

    if (history.length > 0) {
      await addMessage({
        incident_id: incident.id,
        role: "system",
        content: `Related Home History: ${history
          .map(
            (h) =>
              `${h.title}${h.warranty_active ? ` (warranty ${h.warranty_remaining_days}d left)` : ""}`
          )
          .join("; ")}`,
        metadata: { kind: "history_context" },
      });
    }

    let assistantContent: string;
    let nextQuestion = null;
    let decision = null;
    let done = false;

    if (safety.stop_troubleshooting || safety.level === "emergency") {
      decision = await classifyTriage({
        description,
        messages: [{ role: "user", content: description }],
        safety,
        intake,
      });
      decision = { ...decision, outcome: "EMERGENCY" as const };
      await saveTriageDecision({
        incident_id: incident.id,
        outcome: "EMERGENCY",
        likely_issue: decision.likely_issue,
        confidence: decision.confidence,
        observed_facts: decision.observed_facts,
        concerns: decision.concerns,
        recommended_next_step: decision.recommended_next_step,
        technician_trade: decision.technician_trade ?? null,
      });
      await updateIncidentStatus(incident.id, "EMERGENCY");
      assistantContent =
        "This looks like an emergency hazard. Stop troubleshooting. " +
        safety.safe_immediate_actions.slice(0, 2).join(" ");
      done = true;
    } else {
      nextQuestion = await planNextQuestion({
        description,
        intake,
        priorQuestions: [],
        priorAnswers: [],
        messageCount: 1,
      });
      assistantContent = nextQuestion.should_ask
        ? (nextQuestion.question ?? "Can you tell me a bit more?")
        : "Thanks — I have enough to assess this.";
    }

    await addMessage({
      incident_id: incident.id,
      role: "assistant",
      content: assistantContent,
      metadata: {
        kind: safety.stop_troubleshooting ? "emergency" : "question",
        nextQuestion,
        safety,
        intake,
        decision,
      },
    });

    return ok(
      {
        incident,
        intake,
        safety,
        history,
        messages: await listMessages(incident.id),
        nextQuestion,
        decision,
        done,
      },
      201
    );
  } catch (err) {
    console.error(err);
    return fail("INCIDENT_CREATE_FAILED", "Could not create incident", 500);
  }
}
