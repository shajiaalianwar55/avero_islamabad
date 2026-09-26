import { ok, fail } from "@/lib/api";
import { planDiy } from "@/lib/ai/diy";
import {
  addMessage,
  getDiyPlanForIncident,
  getIncident,
  getLatestTriageDecision,
  saveDiyPlan,
  updateIncidentStatus,
} from "@/lib/db/incidents";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const incident = await getIncident(id);
  if (!incident) return fail("NOT_FOUND", "Incident not found", 404);

  const decision = await getLatestTriageDecision(id);
  if (decision?.outcome === "EMERGENCY") {
    return fail("UNSAFE", "DIY is blocked for emergency incidents", 403);
  }

  try {
    const existing = await getDiyPlanForIncident(id);
    if (existing) {
      return ok({
        plan: existing.plan,
        steps: existing.steps,
        currentStep: existing.steps[0] ?? null,
      });
    }

    const diy = await planDiy(
      incident.initial_description,
      decision
        ? {
            outcome: decision.outcome,
            likely_issue: decision.likely_issue,
            confidence: decision.confidence,
            observed_facts: decision.observed_facts,
            concerns: decision.concerns,
            recommended_next_step: decision.recommended_next_step,
            technician_trade: decision.technician_trade ?? undefined,
          }
        : null
    );
    const saved = await saveDiyPlan({
      incident_id: id,
      title: diy.title,
      estimated_minutes: diy.estimated_minutes ?? null,
      tools: diy.tools,
      safety_notes: diy.safety_notes,
      steps: diy.steps.map((s) => ({
        order: s.order,
        instruction: s.instruction,
        success_check: s.success_check,
        failure_action: s.failure_action,
      })),
    });

    await updateIncidentStatus(id, "DIY_ACTIVE");
    await addMessage({
      incident_id: id,
      role: "assistant",
      content: `DIY started: ${diy.title}. Step 1: ${diy.steps[0]?.instruction}`,
      metadata: { kind: "diy_start", planId: saved.plan.id },
    });

    return ok(
      {
        plan: saved.plan,
        steps: saved.steps,
        currentStep: saved.steps[0] ?? null,
      },
      201
    );
  } catch (err) {
    console.error(err);
    return fail("DIY_START_FAILED", "Could not start DIY plan", 500);
  }
}
