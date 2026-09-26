import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { OfferComparison } from "@/components/providers/offer-comparison";

export default async function ProvidersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell
      title="Compare offers"
      description="Recommended, cheapest, earliest, and longest warranty — you choose."
    >
      <Suspense fallback={<p>Loading offers…</p>}>
        <OfferComparison incidentId={id} />
      </Suspense>
    </PageShell>
  );
}
