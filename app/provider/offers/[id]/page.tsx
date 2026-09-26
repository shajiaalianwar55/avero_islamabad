import { PageShell } from "@/components/page-shell";

export default async function ProviderOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell title="Submit offer" description={`Offer form for request ${id}.`}>
      <p className="text-[var(--avero-muted)]">Offer submission — Phase 6.</p>
    </PageShell>
  );
}
