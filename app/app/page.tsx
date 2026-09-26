import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ResidentDashboardPage() {
  return (
    <PageShell
      title="Resident dashboard"
      description="Report a problem, track active incidents, payments, and Home History."
      actions={
        <Link href="/incident/new">
          <Button>Report a problem</Button>
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Active incident", value: "None yet", href: "/incident/new" },
          { label: "Upcoming technician", value: "No booking", href: "/app" },
          { label: "Payment status", value: "—", href: "/app" },
          { label: "Home History", value: "View repairs", href: "/history" },
          { label: "Warranty alerts", value: "Check history", href: "/history" },
          { label: "Home profile", value: "Assets & location", href: "/home" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-5 transition hover:border-[var(--avero-teal)]"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium">{item.label}</h2>
              <Badge>Open</Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--avero-muted)]">{item.value}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
