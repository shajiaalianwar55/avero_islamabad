import { PageShell } from "@/components/page-shell";
import { ProviderJobView } from "./job-view";

export default async function ProviderJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell title="Update job" description="Advance status and request change orders.">
      <ProviderJobView jobId={id} />
    </PageShell>
  );
}
