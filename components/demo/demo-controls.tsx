"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const SCENARIOS = [
  {
    id: "technician",
    label: "Technician: sink leak",
    description: "Kitchen sink leaking when water runs",
    area: "F-10",
  },
  {
    id: "diy",
    label: "DIY: dirty AC filter",
    description:
      "AC airflow weak, filter appears dirty, no electrical warning signs",
    area: "F-10",
  },
  {
    id: "emergency",
    label: "Emergency: buzzing socket",
    description: "Socket buzzing and burning smell",
    area: "F-10",
  },
] as const;

export function DemoControls() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(scenario: (typeof SCENARIOS)[number]) {
    setBusy(true);
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: scenario.description,
        area: scenario.area,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) return;
    const id = json.data.incident.id as string;
    if (json.data.done) router.push(`/incident/${id}/decision`);
    else router.push(`/incident/${id}`);
  }

  async function reset() {
    setBusy(true);
    await fetch("/api/demo/reset", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--avero-muted)]">
            Demo scenarios
          </p>
          <div className="mt-2 space-y-2">
            {SCENARIOS.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant="secondary"
                className="w-full justify-start"
                disabled={busy}
                onClick={() => run(s)}
              >
                {s.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={reset}>
              Reset demo data
            </Button>
          </div>
        </div>
      )}
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        Demo
      </Button>
    </div>
  );
}
