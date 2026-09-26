import { z } from "zod";
import { ok, fail } from "@/lib/api";
import {
  getBooking,
  transitionBookingStatus,
} from "@/lib/db/bookings";
import type { BookingStatus } from "@/types";

const bodySchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "TECHNICIAN_EN_ROUTE",
    "IN_PROGRESS",
    "AWAITING_CUSTOMER_CONFIRMATION",
    "COMPLETED",
    "DISPUTED",
    "CANCELLED",
  ]),
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

  const booking = await getBooking(id);
  if (!booking) return fail("NOT_FOUND", "Booking not found", 404);

  try {
    const updated = await transitionBookingStatus(
      id,
      parsed.data.status as BookingStatus
    );
    return ok({ booking: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid transition";
    return fail("INVALID_TRANSITION", message, 409);
  }
}
