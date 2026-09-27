"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoProgress } from "@/components/demo/progress-steps";
import {
  mergeRepairs,
  readLocalRepairs,
  rememberRepair,
  repairFromApi,
  type LocalRepair,
} from "@/lib/demo/client-history";

export function HistoryTimeline() {
  const [repairs, setRepairs] = useState<LocalRepair[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const local = readLocalRepairs();
    setRepairs(local);

    fetch(`/api/history?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const server = json.ok
          ? (json.data.repairs as Record<string, unknown>[]).map(repairFromApi)
          : [];
        const merged = mergeRepairs(server, local);
        setRepairs(merged);
        // Keep browser copy in sync so the next visit still has DIY/tech jobs
        for (const r of merged) rememberRepair(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    filter === "all"
      ? repairs
      : repairs.filter((r) =>
          `${r.category || ""} ${r.title} ${r.work_done} ${r.provider_name || ""}`
            .toLowerCase()
            .includes(filter)
        );

  return (
    <div className="space-y-4">
      <DemoProgress current="history" branch="DIY" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {["all", "ac", "plumbing", "electrical"].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "secondary"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <p className="text-xs text-[var(--avero-muted)]">
          {loading ? "Loading…" : `${filtered.length} record${filtered.length === 1 ? "" : "s"}`}
        </p>
      </div>
      {filtered.length === 0 && !loading && (
        <p className="text-sm text-[var(--avero-muted)]">
          No repairs yet — finish DIY or book a technician, then return here.
        </p>
      )}
      {filtered.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">{r.title}</CardTitle>
              <Badge variant="outline">
                {new Date(r.completed_at).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Repair: </span>
              {r.work_done}
            </p>
            <p>
              <span className="font-medium">Provider: </span>
              {r.provider_name || "—"}
            </p>
            <p>
              <span className="font-medium">Paid: </span>
              {r.amount_paid != null ? `PKR ${r.amount_paid}` : "—"}
            </p>
            <p>
              <span className="font-medium">Warranty: </span>
              {r.warranty_days != null ? `${r.warranty_days} days` : "none"}
              {r.warranty_remaining_days != null && r.warranty_remaining_days > 0 && (
                <Badge className="ml-2" variant="success">
                  {r.warranty_remaining_days} days left
                </Badge>
              )}
            </p>
            <Link href={`/history/${r.id}`} className="text-[var(--avero-teal)] underline">
              Review previous repair
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
