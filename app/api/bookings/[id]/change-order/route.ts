import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { getBooking, getPaymentByBooking, updateBooking } from "@/lib/demo/store";

const bodySchema = z.object({
  decision: z.enum(["Approve", "Decline"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const booking = getBooking(id);
  if (!booking?.change_order) {
    return fail("INVALID_STATE", "No pending change order");
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Approve or Decline required");

  const status = parsed.data.decision === "Approve" ? "approved" : "declined";
  updateBooking(id, {
    change_order: { ...booking.change_order, status },
  });

  return ok({ booking: getBooking(id), payment: getPaymentByBooking(id) });
}
