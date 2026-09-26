import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { buildServiceRequest } from "@/lib/ai/service-request";
import {
  addMessage,
  createServiceRequest,
  getIncident,
  getLatestTriageDecision,
  listMessages,
  updateIncidentStatus,
} from "@/lib/db/incidents";
import { getHome } from "@/lib/db/history";
import { parseIncidentIntake } from "@/lib/ai/intake";

const bodySchema = z.object({
  preferred_time: z.string().optional(),
  actions_tried: z.array(z.string()).optional(),
  area: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let json: unknown = {};
  try {
    const text = await request.text();
    if (text) json = JSON.parse(text);
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
    const home = await getHome(incident.home_id);
    const decision = await getLatestTriageDecision(id);
    const messages = await listMessages(id);
    const intake = await parseIncidentIntake(
      [incident.initial_description, ...messages.map((m) => m.content)].join("\n")
    );

    const contract = await buildServiceRequest({
      incident_id: id,
      area: parsed.data.area ?? home?.area ?? "F-10",
      description: incident.initial_description,
      intake,
      decision: decision
        ? {
            outcome: decision.outcome,
            likely_issue: decision.likely_issue,
            confidence: decision.confidence,
            observed_facts: decision.observed_facts,
            concerns: decision.concerns,
            recommended_next_step: decision.recommended_next_step,
            technician_trade: decision.technician_trade ?? undefined,
          }
        : null,
      actions_tried: parsed.data.actions_tried,
      preferred_time: parsed.data.preferred_time,
    });

    const serviceRequest = await createServiceRequest({
      incident_id: id,
      category: contract.category,
      area: contract.area,
      title: contract.title,
      problem_summary: contract.problem_summary,
      symptoms: contract.symptoms,
      urgency: contract.urgency,
      hazard_notes: contract.hazard_notes,
      actions_tried: contract.actions_already_tried,
      preferred_time: contract.preferred_time ?? null,
    });

    await updateIncidentStatus(id, "SERVICE_REQUESTED");
    await addMessage({
      incident_id: id,
      role: "assistant",
      content: `Service request created: ${serviceRequest.title} (${serviceRequest.category}, ${serviceRequest.area})`,
      metadata: { kind: "service_request", serviceRequestId: serviceRequest.id },
    });

    return ok({ serviceRequest, contract }, 201);
  } catch (err) {
    console.error(err);
    return fail("SERVICE_REQUEST_FAILED", "Could not create service request", 500);
  }
}
