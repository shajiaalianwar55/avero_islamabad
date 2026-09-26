"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RequestRow = {
  id: string;
  title: string;
  area: string;
  category: string;
  problem_summary: string;
  urgency: string;
  offerCount: number;
};

export function ProviderPortal() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [providerId, setProviderId] = useState(
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
  );
  const [visitFee, setVisitFee] = useState("800");
  const [minTotal, setMinTotal] = useState("3000");
  const [maxTotal, setMaxTotal] = useState("4000");
  const [warranty, setWarranty] = useState("7");
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/provider/requests");
    const json = await res.json();
    if (json.ok) setRequests(json.data.requests);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/provider/requests");
      const json = await res.json();
      if (!cancelled && json.ok) setRequests(json.data.requests);
    }
    void load();
    const t = setInterval(() => {
      void load();
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  async function submitOffer() {
    if (!selected) return;
    const arrival = new Date();
    arrival.setHours(arrival.getHours() + 2);
    const res = await fetch(`/api/provider/requests/${selected}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider_id: providerId,
        visit_fee: Number(visitFee),
        estimated_total_min: Number(minTotal),
        estimated_total_max: Number(maxTotal),
        warranty_days: Number(warranty),
        earliest_arrival: arrival.toISOString(),
        parts_included: "no",
        notes: "Live provider offer",
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setMessage(`Offer submitted by ${json.data.provider.name}`);
      refresh();
    } else {
      setMessage(json.error?.message || "Failed");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Open requests</h2>
        {requests.length === 0 && (
          <p className="text-sm text-[var(--avero-muted)]">
            No open requests. Run a technician triage as the resident first.
          </p>
        )}
        {requests.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelected(r.id)}
            className={`w-full rounded-lg border p-4 text-left ${
              selected === r.id
                ? "border-[var(--avero-teal)] bg-[var(--avero-panel)]"
                : "border-[var(--avero-line)]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{r.title}</p>
              <Badge>{r.urgency}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--avero-muted)]">
              {r.area} · {r.category} · {r.offerCount} offers
            </p>
            <p className="mt-2 text-sm">{r.problem_summary}</p>
            <Link
              href={`/provider/requests/${r.id}`}
              className="mt-2 inline-block text-xs text-[var(--avero-teal)] underline"
            >
              Open detail
            </Link>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit live offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Provider ID (seeded plumber default)</Label>
            <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Visit fee</Label>
              <Input value={visitFee} onChange={(e) => setVisitFee(e.target.value)} />
            </div>
            <div>
              <Label>Warranty days</Label>
              <Input value={warranty} onChange={(e) => setWarranty(e.target.value)} />
            </div>
            <div>
              <Label>Min total</Label>
              <Input value={minTotal} onChange={(e) => setMinTotal(e.target.value)} />
            </div>
            <div>
              <Label>Max total</Label>
              <Input value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} />
            </div>
          </div>
          <Button onClick={submitOffer} disabled={!selected}>
            Submit offer
          </Button>
          {message && <p className="text-sm text-[var(--avero-muted)]">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
