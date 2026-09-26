import { PageShell } from "@/components/page-shell";
import { TriageChat } from "@/components/triage/triage-chat";

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell
      title="Adaptive triage"
      description="One question at a time. Safety is checked after every message."
    >
      <TriageChat incidentId={id} />
    </PageShell>
  );
}
