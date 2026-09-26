import { PageShell } from "@/components/page-shell";
import { BookingPanel } from "@/components/payments/booking-panel";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell
      title="Booking & payment protection"
      description="Demo trust workflow — agreed amount, scope, and no silent price changes."
    >
      <BookingPanel bookingId={id} />
    </PageShell>
  );
}
