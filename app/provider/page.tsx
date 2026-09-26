import { PageShell } from "@/components/page-shell";
import { ProviderPortal } from "@/components/providers/provider-portal";

export default function ProviderDashboardPage() {
  return (
    <PageShell
      title="Provider portal"
      description="Review structured Islamabad requests and submit live offers."
    >
      <ProviderPortal />
    </PageShell>
  );
}
