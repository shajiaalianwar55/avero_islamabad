import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { createBooking, createRepairRecord } from "@/lib/db/bookings";
import {
  getOffer,
  getProvider,
  listOffers,
  loadDemoOffers,
} from "@/lib/db/providers";
import {
  ensureServiceRequestForIncident,
  getIncident,
  getServiceRequest,
  updateIncidentStatus,
} from "@/lib/db/incidents";
import { DEMO_USER_ID } from "@/lib/demo/store";
import { computeWarrantyExpiresAt } from "@/lib/history/warranty";
import { env } from "@/lib/env";
import type { Offer } from "@/types/db";

const bodySchema = z.object({
  offer_id: z.string().uuid().optional(),
  service_request_id: z.string().uuid().optional(),
  incident_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  scheduled_for: z.string().optional(),
});

async function resolveOffer(input: {
  offer_id?: string;
  service_request_id?: string;
  incident_id?: string;
}): Promise<{ offer: Offer; serviceRequestId: string } | null> {
  if (input.offer_id) {
    const existing = await getOffer(input.offer_id);
    if (existing) {
      return { offer: existing, serviceRequestId: existing.service_request_id };
    }
  }

  let srId = input.service_request_id;
  if (srId) {
    const sr = await getServiceRequest(srId);
    if (!sr) srId = undefined;
  }

  if (!srId && input.incident_id) {
    const sr = await ensureServiceRequestForIncident(input.incident_id);
    srId = sr.id;
  }

  if (!srId) return null;

  await loadDemoOffers(srId);
  const offers = await listOffers(srId);
  if (!offers.length) return null;

  const preferred =
    (input.offer_id && offers.find((o) => o.id === input.offer_id)) || offers[0]!;

  return { offer: preferred, serviceRequestId: srId };
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

  if (
    !parsed.data.offer_id &&
    !parsed.data.service_request_id &&
    !parsed.data.incident_id
  ) {
    return fail("VALIDATION_ERROR", "offer_id, service_request_id, or incident_id required");
  }

  try {
    const resolved = await resolveOffer(parsed.data);
    if (!resolved) {
      return fail(
        "NOT_FOUND",
        "Offer not found. Start from Report again if the demo session expired.",
        404
      );
    }

    const { offer } = resolved;
    const serviceRequest = await getServiceRequest(offer.service_request_id);
    if (!serviceRequest) {
      return fail("NOT_FOUND", "Service request not found", 404);
    }

    const provider = await getProvider(offer.provider_id);
    const amount = offer.estimated_total_min ?? offer.visit_fee ?? 3000;
    const scheduled_for =
      parsed.data.scheduled_for ??
      offer.earliest_arrival ??
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { booking, payment } = await createBooking({
      service_request_id: offer.service_request_id,
      offer_id: offer.id,
      user_id: parsed.data.user_id ?? DEMO_USER_ID,
      provider_id: offer.provider_id,
      scheduled_for,
      amount,
    });

    await updateIncidentStatus(serviceRequest.incident_id, "BOOKED");

    // Demo: write Home History immediately on book so the journey always lands there
    let repair = null;
    if (env.NEXT_PUBLIC_DEMO_MODE) {
      const incident = await getIncident(serviceRequest.incident_id);
      if (incident) {
        const completedAt = new Date().toISOString();
        const warrantyDays = offer.warranty_days ?? 30;
        repair = await createRepairRecord({
          home_id: incident.home_id,
          asset_id: incident.asset_id,
          incident_id: incident.id,
          booking_id: booking.id,
          title: serviceRequest.title || `${provider?.name || "Technician"} visit`,
          work_done: `Booked ${provider?.name || "provider"} — ${
            serviceRequest.problem_summary || "service completed for demo"
          }`,
          parts_replaced: [],
          amount_paid: amount,
          provider_name: provider?.name ?? null,
          completed_at: completedAt,
          warranty_days: warrantyDays,
          warranty_expires_at: computeWarrantyExpiresAt(completedAt, warrantyDays),
          before_images: [],
          after_images: [],
          notes: "Saved when booking was confirmed (demo)",
        });
        await updateIncidentStatus(incident.id, "RESOLVED");
      }
    }

    return ok(
      {
        booking,
        payment,
        provider,
        offer,
        serviceRequest,
        repair,
        protection: {
          estimated_service: amount,
          visit_fee: offer.visit_fee,
          currency: "PKR",
          payment_status: payment.state,
          note: "Demo protected payment — provider is paid after completion confirmation.",
        },
      },
      201
    );
  } catch (err) {
    console.error(err);
    return fail("BOOKING_FAILED", "Could not create booking", 500);
  }
}
