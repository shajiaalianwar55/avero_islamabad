import { ok, fail } from "@/lib/api";
import { getBooking, getPaymentForBooking } from "@/lib/db/bookings";
import { getOffer, getProvider } from "@/lib/db/providers";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const booking = await getBooking(id);
    if (!booking) return fail("NOT_FOUND", "Booking not found", 404);
    const payment = await getPaymentForBooking(id);
    const offer = await getOffer(booking.offer_id);
    const provider = await getProvider(booking.provider_id);
    return ok({ booking, payment, offer, provider });
  } catch (err) {
    console.error(err);
    return fail("BOOKING_FETCH_FAILED", "Could not load booking", 500);
  }
}
