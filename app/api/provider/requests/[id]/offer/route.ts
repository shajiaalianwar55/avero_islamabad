import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { createOffer, getProvider } from "@/lib/db/providers";
import { getServiceRequest } from "@/lib/db/incidents";
import { normalizeOffer } from "@/lib/ai/offer-normalizer";

const bodySchema = z.object({
  provider_id: z.string().uuid(),
  visit_fee: z.number().nonnegative().optional().nullable(),
  estimated_total_min: z.number().nonnegative().optional().nullable(),
  estimated_total_max: z.number().nonnegative().optional().nullable(),
  earliest_arrival: z.string().optional().nullable(),
  warranty_days: z.number().int().nonnegative().optional().nullable(),
  parts_included: z.enum(["yes", "no", "unclear"]).optional(),
  notes: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: serviceRequestId } = await context.params;

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

  const serviceRequest = await getServiceRequest(serviceRequestId);
  if (!serviceRequest) {
    return fail("NOT_FOUND", "Service request not found", 404);
  }

  const provider = await getProvider(parsed.data.provider_id);
  if (!provider) return fail("NOT_FOUND", "Provider not found", 404);

  try {
    const normalized = await normalizeOffer({
      provider_id: parsed.data.provider_id,
      service_request_id: serviceRequestId,
      visit_fee: parsed.data.visit_fee,
      estimated_total_min: parsed.data.estimated_total_min,
      estimated_total_max: parsed.data.estimated_total_max,
      earliest_arrival: parsed.data.earliest_arrival,
      warranty_days: parsed.data.warranty_days,
      parts_included: parsed.data.parts_included ?? "unclear",
      notes: parsed.data.notes,
    });

    const offer = await createOffer({
      service_request_id: serviceRequestId,
      provider_id: parsed.data.provider_id,
      visit_fee: normalized.visit_fee ?? null,
      estimated_total_min: normalized.estimated_total_min ?? null,
      estimated_total_max: normalized.estimated_total_max ?? null,
      earliest_arrival: normalized.earliest_arrival ?? null,
      warranty_days: normalized.warranty_days ?? null,
      parts_included: normalized.parts_included,
      notes: normalized.notes.join("; ") || parsed.data.notes || null,
      is_demo: false,
    });

    return ok({ offer, normalized, provider }, 201);
  } catch (err) {
    console.error(err);
    return fail("OFFER_FAILED", "Could not submit offer", 500);
  }
}
