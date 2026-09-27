"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const DEMO_SCENARIOS = [
  {
    id: "technician",
    title: "1. Technician",
    subtitle: "Kitchen sink leak in F-10",
    blurb: "Best full demo — questions → plumber offers → book → history.",
    description: "Kitchen sink leaking when water runs",
    area: "F-10",
    accent: "border-[var(--avero-teal)]",
  },
  {
    id: "diy",
    title: "2. DIY",
    subtitle: "Weak AC airflow",
    blurb: "Low-risk path — guided filter check, one step at a time.",
    description:
      "AC airflow weak, filter appears dirty, no electrical warning signs",
    area: "F-10",
    accent: "border-[var(--avero-sand-deep)]",
  },
  {
    id: "emergency",
    title: "3. Emergency",
    subtitle: "Buzzing socket + burning smell",
    blurb: "Instant safety override — no risky DIY instructions.",
    description: "Socket buzzing and burning smell",
    area: "F-10",
    accent: "border-[var(--avero-danger)]",
  },
] as const;

export function DemoScenarioCards({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(scenario: (typeof DEMO_SCENARIOS)[number]) {
    setBusyId(scenario.id);
    setError(null);
    try {
      await fetch("/api/demo/reset", { method: "POST" }).catch(() => null);
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: scenario.description,
          area: scenario.area,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not start demo");
      const id = json.data.incident.id as string;
      if (json.data.done) router.push(`/incident/${id}/decision`);
      else router.push(`/incident/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo failed");
      setBusyId(null);
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      <div className="grid gap-4 md:grid-cols-3">
        {DEMO_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={busyId !== null}
            onClick={() => run(s)}
            className={`rounded-xl border-2 ${s.accent} bg-[var(--avero-panel)] p-5 text-left transition hover:shadow-md disabled:opacity-60`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--avero-muted)]">
              Guided demo
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink)]">
              {s.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-[var(--avero-ink-soft)]">
              {s.subtitle}
            </p>
            <p className="mt-3 text-sm text-[var(--avero-muted)]">{s.blurb}</p>
            <p className="mt-4 text-sm font-semibold text-[var(--avero-teal)]">
              {busyId === s.id ? "Starting…" : "Start this path →"}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-[var(--avero-danger)]">{error}</p>}
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--avero-muted)]">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyId !== null}
            onClick={async () => {
              setBusyId("reset");
              await fetch("/api/demo/reset", { method: "POST" });
              setBusyId(null);
              router.refresh();
            }}
          >
            Reset demo data
          </Button>
          <span>Tip for judges: run Technician first, then Emergency.</span>
        </div>
      )}
    </div>
  );
}
