import type { BookingStatus, PaymentState } from "@/types";

const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: ["TECHNICIAN_EN_ROUTE", "CANCELLED", "DISPUTED"],
  TECHNICIAN_EN_ROUTE: ["IN_PROGRESS", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["AWAITING_CUSTOMER_CONFIRMATION", "DISPUTED", "CANCELLED"],
  AWAITING_CUSTOMER_CONFIRMATION: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  DISPUTED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  PENDING: ["AUTHORIZED", "DISPUTED", "REFUND_PENDING"],
  AUTHORIZED: ["PROTECTED", "REFUND_PENDING", "DISPUTED"],
  PROTECTED: ["RELEASE_PENDING", "REFUND_PENDING", "DISPUTED"],
  RELEASE_PENDING: ["RELEASED", "DISPUTED", "REFUND_PENDING"],
  RELEASED: [],
  REFUND_PENDING: ["REFUNDED", "DISPUTED"],
  REFUNDED: [],
  DISPUTED: ["REFUND_PENDING", "RELEASE_PENDING", "PROTECTED"],
};

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  if (from === to) return true;
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionPayment(
  from: PaymentState,
  to: PaymentState
): boolean {
  if (from === to) return true;
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextBookingStatuses(from: BookingStatus): BookingStatus[] {
  return [...(BOOKING_TRANSITIONS[from] ?? [])];
}

export function nextPaymentStates(from: PaymentState): PaymentState[] {
  return [...(PAYMENT_TRANSITIONS[from] ?? [])];
}

/**
 * Demo happy-path: provider marks complete -> awaiting confirmation + release pending.
 */
export function onProviderMarkedComplete(currentPayment: PaymentState): {
  booking: BookingStatus;
  payment: PaymentState;
} {
  const payment = canTransitionPayment(currentPayment, "RELEASE_PENDING")
    ? "RELEASE_PENDING"
    : currentPayment;
  return {
    booking: "AWAITING_CUSTOMER_CONFIRMATION",
    payment,
  };
}

/**
 * Resident confirms completion -> booking COMPLETED, payment RELEASED.
 */
export function onCustomerConfirmedCompletion(currentPayment: PaymentState): {
  booking: BookingStatus;
  payment: PaymentState;
} {
  let payment: PaymentState = currentPayment;
  if (canTransitionPayment(payment, "RELEASE_PENDING")) {
    payment = "RELEASE_PENDING";
  }
  if (canTransitionPayment(payment, "RELEASED")) {
    payment = "RELEASED";
  }
  return { booking: "COMPLETED", payment };
}
