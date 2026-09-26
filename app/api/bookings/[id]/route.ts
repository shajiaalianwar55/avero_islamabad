import { ok, fail } from "@/lib/api";
import {
  getBooking,
  getPaymentByBooking,
  getOffer,
  getProvider,
} from "@/lib/demo/store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const booking = getBooking(id);
  if (!booking) return fail("NOT_FOUND", "Booking not found", 404);
  const payment = getPaymentByBooking(id);
  const offer = getOffer(booking.offer_id);
  const provider = getProvider(booking.provider_id);
  return ok({ booking, payment, offer, provider });
}
