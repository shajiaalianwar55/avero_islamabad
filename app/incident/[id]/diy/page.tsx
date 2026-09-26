import { PageShell } from "@/components/page-shell";
import { DiyWizard } from "@/components/diy/diy-wizard";

export default async function DiyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell
      title="DIY guidance"
      description="One step at a time. You can stop or escalate at any point."
    >
      <DiyWizard incidentId={id} />
    </PageShell>
  );
}
