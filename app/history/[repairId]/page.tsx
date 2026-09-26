import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRepair } from "@/lib/demo/store";
import { warrantyRemainingDays } from "@/lib/history/warranty";

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ repairId: string }>;
}) {
  const { repairId } = await params;
  const repair = getRepair(repairId);
  const remaining = repair
    ? warrantyRemainingDays(repair.warranty_expires_at)
    : null;

  if (!repair) {
    return (
      <PageShell title="Repair not found">
        <Link href="/history" className="text-[var(--avero-teal)] underline">
          Back to history
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell title="Repair record" description="Full history entry for this home.">
      <Card>
        <CardHeader>
          <CardTitle>{repair.title}</CardTitle>
          <Badge variant="outline">
            {new Date(repair.completed_at).toLocaleString()}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Work done:</strong> {repair.work_done}
          </p>
          <p>
            <strong>Provider:</strong> {repair.provider_name || "—"}
          </p>
          <p>
            <strong>Paid:</strong>{" "}
            {repair.amount_paid != null ? `PKR ${repair.amount_paid}` : "—"}
          </p>
          <p>
            <strong>Warranty:</strong>{" "}
            {repair.warranty_days != null ? `${repair.warranty_days} days` : "none"}
            {remaining != null && remaining > 0 && <> · {remaining} remaining</>}
          </p>
          <p>
            <strong>Parts:</strong> {repair.parts_replaced.join(", ") || "—"}
          </p>
          <p>
            <strong>Notes:</strong> {repair.notes || "—"}
          </p>
          <Link href="/history" className="text-[var(--avero-teal)] underline">
            Back to timeline
          </Link>
        </CardContent>
      </Card>
    </PageShell>
  );
}
