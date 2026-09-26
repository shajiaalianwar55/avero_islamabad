import { PageShell } from "@/components/page-shell";
import { HistoryTimeline } from "@/components/history/history-timeline";

export default function HistoryPage() {
  return (
    <PageShell
      title="Home History"
      description="Repairs, warranties, and repeated issues for your Islamabad home."
    >
      <HistoryTimeline />
    </PageShell>
  );
}
