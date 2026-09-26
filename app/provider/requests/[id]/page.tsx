import { PageShell } from "@/components/page-shell";

export default async function ProviderRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell title="Service request" description={`Structured request ${id}.`}>
      <p className="text-[var(--avero-muted)]">Provider request detail — Phase 6.</p>
    </PageShell>
  );
}
