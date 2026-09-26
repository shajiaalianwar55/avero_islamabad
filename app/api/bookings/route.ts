import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { createBooking } from "@/lib/db/bookings";
import { getOffer, getProvider } from "@/lib/db/providers";
import { getServiceRequest, updateIncidentStatus } from "@/lib/db/incidents";
import { DEMO_USER_ID } from "@/lib/demo/store";

const bodySchema = z.object({
  offer_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  scheduled_for: z.string().optional(),
});

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

  const offer = await getOffer(parsed.data.offer_id);
  if (!offer) return fail("NOT_FOUND", "Offer not found", 404);

  const serviceRequest = await getServiceRequest(offer.service_request_id);
  if (!serviceRequest) {
    return fail("NOT_FOUND", "Service request not found", 404);
  }

  const provider = await getProvider(offer.provider_id);
  const amount =
    offer.estimated_total_min ??
    offer.visit_fee ??
    3000;

  const scheduled_for =
    parsed.data.scheduled_for ??
    offer.earliest_arrival ??
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  try {
    const { booking, payment } = await createBooking({
      service_request_id: offer.service_request_id,
      offer_id: offer.id,
      user_id: parsed.data.user_id ?? DEMO_USER_ID,
      provider_id: offer.provider_id,
      scheduled_for,
      amount,
    });

    await updateIncidentStatus(serviceRequest.incident_id, "BOOKED");

    return ok(
      {
        booking,
        payment,
        provider,
        offer,
        serviceRequest,
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
