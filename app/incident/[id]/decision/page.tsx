import { PageShell } from "@/components/page-shell";
import { DecisionView } from "@/components/safety/decision-view";

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell
      title="Decision evidence"
      description="Facts, concerns, recommendation — not hidden model reasoning."
    >
      <DecisionView incidentId={id} />
    </PageShell>
  );
}
