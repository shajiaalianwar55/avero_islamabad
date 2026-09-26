/**
 * P2 stubs — surfaces without partner approvals.
 */

export function PaymentGatewayStub(props: { amount: number }) {
  return {
    provider: "stripe_like_stub",
    status: "not_connected",
    amount: props.amount,
    message:
      "Real payment gateway hook — demo uses protected state machine instead.",
  };
}

export function MapsPlacesStub(area: string) {
  return {
    provider: "google_places_stub",
    area,
    message: "Live maps/Places billing not required for the core demo.",
  };
}

export async function sendPushStub(userId: string, title: string) {
  return { delivered: false, userId, title, reason: "push_not_configured" };
}

export function WhatsAppStub() {
  return {
    status: "requires_business_approval",
    message: "WhatsApp Business integration intentionally stubbed.",
  };
}
