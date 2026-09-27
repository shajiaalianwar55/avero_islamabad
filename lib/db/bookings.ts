import { shouldUseDemoBackend } from "@/lib/env";
import * as demo from "@/lib/demo/store";
import type { Booking, Payment, RepairRecord, Review } from "@/types/db";
import type { BookingStatus, PaymentState } from "@/types";
import {
  canTransitionBooking,
  canTransitionPayment,
} from "@/lib/payments/state";

function shouldUseDemoStore(): boolean {
  return shouldUseDemoBackend();
}

async function getAdmin() {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  return createServiceClient();
}

function failSupabase(error: unknown): never {
  console.error("Supabase booking operation failed", error);
  throw error;
}

export async function createBooking(input: {
  service_request_id: string;
  offer_id: string;
  user_id?: string;
  provider_id: string;
  scheduled_for: string;
  amount: number;
}): Promise<{ booking: Booking; payment: Payment }> {
  if (shouldUseDemoStore()) return demo.createBooking(input);

  try {
    const supabase = await getAdmin();
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        service_request_id: input.service_request_id,
        offer_id: input.offer_id,
        user_id: input.user_id ?? demo.DEMO_USER_ID,
        provider_id: input.provider_id,
        status: "CONFIRMED",
        scheduled_for: input.scheduled_for,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase
      .from("offers")
      .update({ status: "ACCEPTED" })
      .eq("id", input.offer_id);

    await supabase
      .from("service_requests")
      .update({ status: "BOOKED" })
      .eq("id", input.service_request_id);

    const { data: payment, error: payError } = await supabase
      .from("payments")
      .insert({
        booking_id: booking.id,
        amount: input.amount,
        currency: "PKR",
        state: "PROTECTED",
        is_demo: true,
      })
      .select()
      .single();
    if (payError) throw payError;

    return { booking: booking as Booking, payment: payment as Payment };
  } catch (error) {
    return failSupabase(error);
  }
}

export async function getBooking(id: string): Promise<Booking | null> {
  if (shouldUseDemoStore()) return demo.getBooking(id) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Booking) ?? null;
  } catch (error) {
    return failSupabase(error);
  }
}

export async function getPaymentForBooking(
  bookingId: string
): Promise<Payment | null> {
  if (shouldUseDemoStore()) return demo.getPaymentForBooking(bookingId) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (error) throw error;
    return (data as Payment) ?? null;
  } catch (error) {
    return failSupabase(error);
  }
}

/** Apply a booking status change, walking one intermediate hop when needed. */
export async function transitionBookingStatus(
  bookingId: string,
  next: BookingStatus
): Promise<Booking | null> {
  const booking = await getBooking(bookingId);
  if (!booking) return null;
  if (booking.status === next) return booking;

  let from = booking.status;
  if (!canTransitionBooking(from, next)) {
    // Common shortcut: IN_PROGRESS -> COMPLETED via awaiting confirmation
    if (
      from === "IN_PROGRESS" &&
      next === "COMPLETED" &&
      canTransitionBooking(from, "AWAITING_CUSTOMER_CONFIRMATION")
    ) {
      await applyBookingStatus(bookingId, "AWAITING_CUSTOMER_CONFIRMATION");
      from = "AWAITING_CUSTOMER_CONFIRMATION";
    } else {
      throw new Error(`Invalid booking transition: ${from} -> ${next}`);
    }
  }

  if (!canTransitionBooking(from, next)) {
    throw new Error(`Invalid booking transition: ${from} -> ${next}`);
  }

  return applyBookingStatus(bookingId, next);
}

async function applyBookingStatus(
  bookingId: string,
  next: BookingStatus
): Promise<Booking | null> {
  if (shouldUseDemoStore()) return demo.updateBookingStatus(bookingId, next);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .select()
      .single();
    if (error) throw error;
    return data as Booking;
  } catch (error) {
    return failSupabase(error);
  }
}

/** Apply a payment state change, walking PROTECTED -> RELEASE_PENDING -> RELEASED when needed. */
export async function transitionPaymentState(
  bookingId: string,
  next: PaymentState
): Promise<Payment | null> {
  const payment = await getPaymentForBooking(bookingId);
  if (!payment) return null;
  if (payment.state === next) return payment;

  let from = payment.state;
  if (!canTransitionPayment(from, next)) {
    if (
      from === "PROTECTED" &&
      next === "RELEASED" &&
      canTransitionPayment(from, "RELEASE_PENDING")
    ) {
      await applyPaymentState(bookingId, "RELEASE_PENDING");
      from = "RELEASE_PENDING";
    } else {
      throw new Error(`Invalid payment transition: ${from} -> ${next}`);
    }
  }

  if (!canTransitionPayment(from, next)) {
    throw new Error(`Invalid payment transition: ${from} -> ${next}`);
  }

  return applyPaymentState(bookingId, next);
}

async function applyPaymentState(
  bookingId: string,
  next: PaymentState
): Promise<Payment | null> {
  if (shouldUseDemoStore()) return demo.updatePaymentState(bookingId, next);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("payments")
      .update({ state: next, updated_at: new Date().toISOString() })
      .eq("booking_id", bookingId)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  } catch (error) {
    return failSupabase(error);
  }
}

export async function createRepairRecord(
  input: Omit<RepairRecord, "id" | "created_at">
): Promise<RepairRecord> {
  if (shouldUseDemoStore()) return demo.createRepairRecord(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("repair_records")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as RepairRecord;
  } catch (error) {
    return failSupabase(error);
  }
}

export async function getRepairForBooking(
  bookingId: string
): Promise<RepairRecord | null> {
  if (shouldUseDemoStore()) {
    return demo.listRepairHistory().find((row) => row.booking_id === bookingId) ?? null;
  }

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("repair_records")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (error) throw error;
    return (data as RepairRecord) ?? null;
  } catch (error) {
    return failSupabase(error);
  }
}

export async function createReview(input: {
  booking_id: string;
  rating: number;
  comment?: string | null;
}): Promise<Review> {
  if (shouldUseDemoStore()) return demo.createReview(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        booking_id: input.booking_id,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  } catch (error) {
    return failSupabase(error);
  }
}
