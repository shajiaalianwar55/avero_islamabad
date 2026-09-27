import { z } from "zod";
import { ok, fail } from "@/lib/api";
import {
  createRepairRecord,
  createReview,
  getBooking,
  getPaymentForBooking,
  getRepairForBooking,
  transitionBookingStatus,
  transitionPaymentState,
} from "@/lib/db/bookings";
import { getOffer, getProvider } from "@/lib/db/providers";
import { getIncident, getServiceRequest, updateIncidentStatus } from "@/lib/db/incidents";
import {
  onCustomerConfirmedCompletion,
  onProviderMarkedComplete,
} from "@/lib/payments/state";
import { computeWarrantyExpiresAt } from "@/lib/history/warranty";

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  work_done: z.string().optional(),
  parts_replaced: z.array(z.string()).optional(),
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

  const booking = await getBooking(id);
  if (!booking) return fail("NOT_FOUND", "Booking not found", 404);

  if (
    booking.status !== "CONFIRMED" &&
    booking.status !== "TECHNICIAN_EN_ROUTE" &&
    booking.status !== "AWAITING_CUSTOMER_CONFIRMATION" &&
    booking.status !== "IN_PROGRESS" &&
    booking.status !== "COMPLETED"
  ) {
    return fail(
      "INVALID_STATE",
      `Cannot confirm completion from status ${booking.status}`,
      409
    );
  }

  try {
    let currentBooking = booking;
    if (currentBooking.status === "CONFIRMED") {
      currentBooking =
        (await transitionBookingStatus(id, "TECHNICIAN_EN_ROUTE")) ?? currentBooking;
    }
    if (currentBooking.status === "TECHNICIAN_EN_ROUTE") {
      currentBooking =
        (await transitionBookingStatus(id, "IN_PROGRESS")) ?? currentBooking;
    }

    let payment = await getPaymentForBooking(id);
    if (currentBooking.status === "IN_PROGRESS") {
      const providerNext = onProviderMarkedComplete(
        payment?.state ?? "PROTECTED"
      );
      currentBooking =
        (await transitionBookingStatus(id, providerNext.booking)) ?? currentBooking;
      if (payment && payment.state !== providerNext.payment) {
        payment = await transitionPaymentState(id, providerNext.payment);
      }
    }

    const next = onCustomerConfirmedCompletion(payment?.state ?? "PROTECTED");

    const updatedBooking =
      currentBooking.status === "COMPLETED"
        ? currentBooking
        : await transitionBookingStatus(id, next.booking);

    let updatedPayment = payment;
    if (payment && payment.state !== next.payment) {
      updatedPayment = await transitionPaymentState(id, next.payment);
    }

    const offer = await getOffer(booking.offer_id);
    const provider = await getProvider(booking.provider_id);
    const serviceRequest = await getServiceRequest(booking.service_request_id);
    const incident = serviceRequest
      ? await getIncident(serviceRequest.incident_id)
      : null;

    if (incident) {
      await updateIncidentStatus(incident.id, "RESOLVED");
    }

    const completedAt = new Date().toISOString();
    const warrantyDays = offer?.warranty_days ?? 30;
    let repair = await getRepairForBooking(id);

    if (!repair && incident) {
      repair = await createRepairRecord({
        home_id: incident.home_id,
        asset_id: incident.asset_id,
        incident_id: incident.id,
        booking_id: booking.id,
        title: serviceRequest?.title ?? "Repair completed",
        work_done:
          parsed.data.work_done ??
          "Work completed as agreed in the service request",
        parts_replaced: parsed.data.parts_replaced ?? [],
        amount_paid: payment?.amount ?? null,
        provider_name: provider?.name ?? null,
        completed_at: completedAt,
        warranty_days: warrantyDays,
        warranty_expires_at: computeWarrantyExpiresAt(completedAt, warrantyDays),
        before_images: [],
        after_images: [],
        notes: "Saved from customer confirmation",
      });
    }

    let review = null;
    if (parsed.data.rating) {
      review = await createReview({
        booking_id: id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      });
    }

    return ok({
      booking: updatedBooking,
      payment: updatedPayment,
      repair,
      review,
    });
  } catch (err) {
    console.error(err);
    return fail("CONFIRM_FAILED", "Could not confirm completion", 500);
  }
}
