import { parseIncidentIntake } from "@/lib/ai/intake";
import { planNextQuestion } from "@/lib/ai/question-planner";
import { classifySafety } from "@/lib/ai/safety-classifier";
import { classifyOutcome } from "@/lib/ai/triage";
import { assessSafetyRules, mergeSafety } from "@/lib/safety/rules";
import { findRelevantWarrantyAlert } from "@/lib/history/warranty";
import {
  addMessage,
  createIncident,
  createSafetyAssessment,
  createTriageDecision,
  getIncident,
  listMessages,
  listRepairs,
  updateIncident,
} from "@/lib/demo/store";
import type { TriageDecision } from "@/types";

function toDecisionRow(incidentId: string, decision: TriageDecision) {
  return {
    incident_id: incidentId,
    outcome: decision.outcome,
    likely_issue: decision.likely_issue,
    confidence: decision.confidence,
    observed_facts: decision.observed_facts,
    concerns: decision.concerns,
    recommended_next_step: decision.recommended_next_step,
    technician_trade: decision.technician_trade ?? null,
  };
}

export async function startIncident(description: string, area: string) {
  const incident = createIncident({ initial_description: description });
  const intake = await parseIncidentIntake(description);
  updateIncident(incident.id, { category_guess: intake.category_guess });
  // Area is stored on the home profile; keep for service-request matching metadata.
  void area;

  const warranty = findRelevantWarrantyAlert({
    description,
    repairs: listRepairs(incident.home_id),
  });

  const ruleSafety = assessSafetyRules(description);
  const aiSafety = await classifySafety(description);
  const safety = mergeSafety(ruleSafety, aiSafety);

  createSafetyAssessment({
    incident_id: incident.id,
    level: safety.level,
    hazard_codes: safety.hazard_codes,
    stop_troubleshooting: safety.stop_troubleshooting,
    safe_actions: safety.safe_immediate_actions,
    prohibited_actions: safety.prohibited_actions,
  });

  if (safety.stop_troubleshooting) {
    updateIncident(incident.id, { status: "EMERGENCY" });
    const decision = await classifyOutcome({
      description,
      intake,
      answers: [],
      emergency: true,
    });
    createTriageDecision(toDecisionRow(incident.id, decision));
    addMessage(
      incident.id,
      "assistant",
      "Emergency safety override. Stop troubleshooting and follow the safe actions shown.",
      { safety, decision, warranty }
    );
    return {
      incident: getIncident(incident.id)!,
      safety,
      decision,
      warranty,
      done: true as const,
    };
  }

  const question = await planNextQuestion({
    description,
    intake,
    priorQuestions: [],
    priorAnswers: [],
    messageCount: 0,
  });

  const intro = warranty
    ? `${warranty.message} Meanwhile, I need one detail to triage this safely.`
    : "I can help triage this. One quick question:";

  addMessage(
    incident.id,
    "assistant",
    `${intro}\n\n${question.question ?? "Can you share more detail?"}`,
    { question, intake, safety, warranty }
  );

  return {
    incident: getIncident(incident.id)!,
    safety,
    question,
    intake,
    warranty,
    done: false as const,
  };
}

export async function continueIncident(incidentId: string, userText: string) {
  const incident = getIncident(incidentId);
  if (!incident) throw new Error("Incident not found");

  addMessage(incidentId, "user", userText);

  const messages = listMessages(incidentId);
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  const description = incident.initial_description;
  const intake = await parseIncidentIntake(`${description}\n${userMsgs.join("\n")}`);

  const ruleSafety = assessSafetyRules(`${description}\n${userText}`);
  const aiSafety = await classifySafety(`${description}\n${userText}`);
  const safety = mergeSafety(ruleSafety, aiSafety);

  createSafetyAssessment({
    incident_id: incidentId,
    level: safety.level,
    hazard_codes: safety.hazard_codes,
    stop_troubleshooting: safety.stop_troubleshooting,
    safe_actions: safety.safe_immediate_actions,
    prohibited_actions: safety.prohibited_actions,
  });

  if (safety.stop_troubleshooting) {
    updateIncident(incidentId, { status: "EMERGENCY" });
    const decision = await classifyOutcome({
      description,
      intake,
      answers: userMsgs.slice(1),
      emergency: true,
    });
    createTriageDecision(toDecisionRow(incidentId, decision));
    addMessage(incidentId, "assistant", "Emergency safety override. Stop troubleshooting.", {
      safety,
      decision,
    });
    return { safety, decision, done: true as const };
  }

  const priorQuestions = messages
    .filter(
      (m) =>
        m.role === "assistant" &&
        m.metadata &&
        (m.metadata as { question?: unknown }).question
    )
    .map((m) => m.content);

  const question = await planNextQuestion({
    description,
    intake,
    priorQuestions,
    priorAnswers: userMsgs.slice(1),
    messageCount: messages.length,
  });

  if (!question.should_ask) {
    const decision = await classifyOutcome({
      description,
      intake,
      answers: userMsgs.slice(1),
      emergency: false,
    });
    createTriageDecision(toDecisionRow(incidentId, decision));
    updateIncident(incidentId, {
      status:
        decision.outcome === "DIY"
          ? "DIY_ACTIVE"
          : decision.outcome === "EMERGENCY"
            ? "EMERGENCY"
            : "TECHNICIAN_REQUIRED",
      category_guess: intake.category_guess,
    });
    addMessage(
      incidentId,
      "assistant",
      `Decision: ${decision.outcome}. ${decision.recommended_next_step}`,
      { decision, safety, intake }
    );
    return { safety, decision, done: true as const };
  }

  addMessage(incidentId, "assistant", question.question ?? "Tell me a bit more.", {
    question,
    intake,
    safety,
  });
  return { safety, question, done: false as const };
}
