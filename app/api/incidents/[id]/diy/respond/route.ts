import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { reassessDiy } from "@/lib/ai/diy";
import {
  addMessage,
  getDiyPlanForIncident,
  getIncident,
  updateIncidentStatus,
} from "@/lib/db/incidents";

const bodySchema = z.object({
  step_order: z.number().int().positive(),
  response: z.string().min(1),
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

  const diy = await getDiyPlanForIncident(id);
  if (!diy) return fail("NO_PLAN", "No DIY plan for this incident", 400);

  const step = diy.steps.find((s) => s.step_order === parsed.data.step_order);
  if (!step) return fail("INVALID_STEP", "Step not found", 400);

  try {
    await addMessage({
      incident_id: id,
      role: "user",
      content: parsed.data.response,
      metadata: { kind: "diy_response", step_order: parsed.data.step_order },
    });

    const reassessment = await reassessDiy({
      description: incident.initial_description,
      stepOrder: parsed.data.step_order,
      totalSteps: diy.steps.length,
      stepInstruction: step.instruction,
      userResponse: parsed.data.response,
    });

    let currentStep = null;
    if (reassessment.status === "CONTINUE") {
      const nextOrder =
        reassessment.next_step_number ?? parsed.data.step_order + 1;
      currentStep = diy.steps.find((s) => s.step_order === nextOrder) ?? null;
      await addMessage({
        incident_id: id,
        role: "assistant",
        content: currentStep
          ? `Step ${currentStep.step_order}: ${currentStep.instruction}`
          : reassessment.reason_summary,
        metadata: { kind: "diy_step", reassessment },
      });
    } else if (reassessment.status === "RESOLVED") {
      await updateIncidentStatus(id, "RESOLVED");
      await addMessage({
        incident_id: id,
        role: "assistant",
        content: `Resolved via DIY. ${reassessment.reason_summary}`,
        metadata: { kind: "diy_resolved", reassessment },
      });
    } else if (reassessment.status === "EMERGENCY") {
      await updateIncidentStatus(id, "EMERGENCY");
      await addMessage({
        incident_id: id,
        role: "assistant",
        content: `Stop DIY — emergency signals. ${reassessment.reason_summary}`,
        metadata: { kind: "diy_emergency", reassessment },
      });
    } else {
      await updateIncidentStatus(id, "TECHNICIAN_REQUIRED");
      await addMessage({
        incident_id: id,
        role: "assistant",
        content: `Escalating to technician. ${reassessment.reason_summary}`,
        metadata: { kind: "diy_escalate", reassessment },
      });
    }

    return ok({
      reassessment,
      currentStep,
      plan: diy.plan,
      steps: diy.steps,
    });
  } catch (err) {
    console.error(err);
    return fail("DIY_RESPOND_FAILED", "Could not process DIY response", 500);
  }
}
