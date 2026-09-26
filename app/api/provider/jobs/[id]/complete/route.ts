import { z } from "zod";
import { ok, fail } from "@/lib/api";
import {
  getBooking,
  getPaymentForBooking,
  transitionBookingStatus,
  transitionPaymentState,
} from "@/lib/db/bookings";
import { onProviderMarkedComplete } from "@/lib/payments/state";

const bodySchema = z.object({
  work_done: z.string().optional(),
  parts_replaced: z.array(z.string()).optional(),
  change_order: z
    .object({
      reason: z.string(),
      additional_amount: z.number().nonnegative(),
      note: z.string().optional(),
    })
    .optional(),
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

  try {
    // Move through IN_PROGRESS if still earlier
    if (
      booking.status === "CONFIRMED" ||
      booking.status === "TECHNICIAN_EN_ROUTE"
    ) {
      if (booking.status === "CONFIRMED") {
        await transitionBookingStatus(id, "TECHNICIAN_EN_ROUTE");
      }
      await transitionBookingStatus(id, "IN_PROGRESS");
    }

    const payment = await getPaymentForBooking(id);
    const next = onProviderMarkedComplete(payment?.state ?? "PROTECTED");

    const updatedBooking = await transitionBookingStatus(id, next.booking);
    const updatedPayment = payment
      ? await transitionPaymentState(id, next.payment)
      : null;

    return ok({
      booking: updatedBooking,
      payment: updatedPayment,
      work_done: parsed.data.work_done ?? null,
      parts_replaced: parsed.data.parts_replaced ?? [],
      change_order: parsed.data.change_order ?? null,
      note: parsed.data.change_order
        ? "Change order requires customer approval before amount changes."
        : "Awaiting customer confirmation to release protected payment.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not complete job";
    return fail("COMPLETE_FAILED", message, 409);
  }
}
