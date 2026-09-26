import { z } from "zod";
import { completeValidatedJson } from "@/lib/ai/provider";
import type { NormalizedOffer } from "@/types";

const normalizedOfferSchema: z.ZodType<NormalizedOffer> = z.object({
  provider_id: z.string(),
  service_request_id: z.string(),
  visit_fee: z.number().optional(),
  estimated_total_min: z.number().optional(),
  estimated_total_max: z.number().optional(),
  earliest_arrival: z.string().optional(),
  warranty_days: z.number().optional(),
  parts_included: z.enum(["yes", "no", "unclear"]),
  notes: z.array(z.string()),
  unknown_fields: z.array(z.string()),
});

export type RawOfferInput = {
  provider_id: string;
  service_request_id: string;
  visit_fee?: number | null;
  estimated_total_min?: number | null;
  estimated_total_max?: number | null;
  earliest_arrival?: string | null;
  warranty_days?: number | null;
  parts_included?: string | null;
  notes?: string | string[] | null;
};

export function fallbackNormalizeOffer(input: RawOfferInput): NormalizedOffer {
  const unknown_fields: string[] = [];
  const partsRaw = (input.parts_included ?? "").toString().toLowerCase();
  let parts_included: NormalizedOffer["parts_included"] = "unclear";
  if (partsRaw === "yes" || partsRaw === "no") {
    parts_included = partsRaw;
  } else if (!partsRaw) {
    unknown_fields.push("parts_included");
  } else {
    unknown_fields.push("parts_included");
  }

  if (input.visit_fee == null) unknown_fields.push("visit_fee");
  if (input.estimated_total_min == null) unknown_fields.push("estimated_total_min");
  if (input.estimated_total_max == null) unknown_fields.push("estimated_total_max");
  if (!input.earliest_arrival) unknown_fields.push("earliest_arrival");
  if (input.warranty_days == null) unknown_fields.push("warranty_days");

  const notes = Array.isArray(input.notes)
    ? input.notes
    : input.notes
      ? [input.notes]
      : [];

  return {
    provider_id: input.provider_id,
    service_request_id: input.service_request_id,
    visit_fee: input.visit_fee ?? undefined,
    estimated_total_min: input.estimated_total_min ?? undefined,
    estimated_total_max: input.estimated_total_max ?? undefined,
    earliest_arrival: input.earliest_arrival ?? undefined,
    warranty_days: input.warranty_days ?? undefined,
    parts_included,
    notes,
    unknown_fields,
  };
}

/**
 * Normalize provider offer fields. Missing fields stay unknown — never invent.
 */
export async function normalizeOffer(
  input: RawOfferInput
): Promise<NormalizedOffer> {
  return completeValidatedJson({
    system: `Normalize a technician offer into NormalizedOffer JSON.
Missing fields must be listed in unknown_fields. Never invent prices, times, or warranty.`,
    user: JSON.stringify(input),
    schema: normalizedOfferSchema,
    fallback: () => fallbackNormalizeOffer(input),
  });
}
