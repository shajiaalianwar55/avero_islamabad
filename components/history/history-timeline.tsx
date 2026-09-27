"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemoProgress } from "@/components/demo/progress-steps";

type Repair = {
  id: string;
  title: string;
  work_done: string;
  provider_name?: string | null;
  amount_paid?: number | null;
  completed_at: string;
  warranty_days?: number | null;
  warranty_remaining_days?: number | null;
  category?: string;
};

export function HistoryTimeline() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setRepairs(json.data.repairs);
      });
  }, []);

  const filtered =
    filter === "all"
      ? repairs
      : repairs.filter((r) => (r.category || "").includes(filter));

  return (
    <div className="space-y-4">
      <DemoProgress forceStep={5} />
      <div className="rounded-lg border border-[var(--avero-teal)]/30 bg-[var(--avero-teal)]/5 p-4 text-sm">
        <p className="font-medium">Demo complete</p>
        <p className="mt-1 text-[var(--avero-muted)]">
          Repairs and warranties stay with the home. The seeded Bedroom AC record shows
          active warranty for repeat issues.
        </p>
        <Link href="/#start-demo" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">
            Run another demo
          </Button>
        </Link>
      </div>
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
      {filtered.length === 0 && (
        <p className="text-sm text-[var(--avero-muted)]">
          No repairs yet — finish a technician booking to create one.
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
