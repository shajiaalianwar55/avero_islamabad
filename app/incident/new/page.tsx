import { PageShell } from "@/components/page-shell";
import { GuidedIncidentFlow } from "@/components/triage/guided-flow";

export default function NewIncidentPage() {
  return (
    <PageShell
      title="Report a home problem"
      description="Choose the appliance, answer a few questions, and Avero picks the safest next path."
    >
      <GuidedIncidentFlow />
    </PageShell>
  );
}
