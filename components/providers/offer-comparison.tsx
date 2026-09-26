"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OfferRow = {
  offer: {
    id: string;
    visit_fee?: number | null;
    estimated_total_min?: number | null;
    estimated_total_max?: number | null;
    earliest_arrival?: string | null;
    warranty_days?: number | null;
    parts_included?: string | null;
    notes?: string | null;
    is_demo?: boolean;
  };
  provider: { name: string; rating: number; verified: boolean };
  badges: string[];
  score: number;
};

export function OfferComparison({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [srId, setSrId] = useState(params.get("sr") || "");
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [waited, setWaited] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    const res = await fetch(`/api/service-requests/${id}/offers`);
    const json = await res.json();
    if (json.ok) setOffers(json.data.offers);
  }, []);

  useEffect(() => {
    async function ensureSr() {
      let id = srId;
      if (!id) {
        const res = await fetch(`/api/incidents/${incidentId}/service-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json.ok) {
          id = json.data.serviceRequest.id;
          setSrId(id);
        }
      }
      if (id) await load(id);
    }
    ensureSr();
  }, [incidentId, srId, load]);

  useEffect(() => {
    if (!srId) return;
    const t = setTimeout(() => setWaited(true), 10000);
    return () => clearTimeout(t);
  }, [srId]);

  async function loadDemo() {
    setLoading(true);
    await fetch("/api/demo/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_request_id: srId }),
    });
    await load(srId);
    setLoading(false);
  }

  async function book(offerId: string) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_id: offerId }),
    });
    const json = await res.json();
    if (json.ok) router.push(`/booking/${json.data.booking.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--avero-muted)]">
          Compare price, arrival, rating and warranty. Missing fields stay unknown.
        </p>
        {(waited || offers.length === 0) && (
          <Button variant="secondary" onClick={loadDemo} disabled={loading || !srId}>
            Load demo offers
          </Button>
        )}
      </div>
      {offers.length === 0 && (
        <p className="text-sm text-[var(--avero-muted)]">
          Waiting for provider offers… Open the provider portal in another tab to submit a
          live quote, or load demo offers.
        </p>
      )}
      <div className="grid gap-4">
        {offers.map((row) => {
          const o = row.offer;
          return (
            <Card key={o.id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{row.provider?.name || "Provider"}</CardTitle>
                  <p className="text-sm text-[var(--avero-muted)]">
                    Rating {row.provider?.rating ?? "—"}
                    {row.provider?.verified ? " · Verified" : ""}
                    {o.is_demo ? " · Demo offer" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(row.badges || []).map((b) => (
                    <Badge key={b}>{b}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Visit fee: {o.visit_fee != null ? `PKR ${o.visit_fee}` : "unknown"}
                </p>
                <p>
                  Estimated total:{" "}
                  {o.estimated_total_min != null
                    ? `PKR ${o.estimated_total_min}${
                        o.estimated_total_max != null ? `–${o.estimated_total_max}` : ""
                      }`
                    : "unknown"}
                </p>
                <p>
                  Earliest arrival:{" "}
                  {o.earliest_arrival
                    ? new Date(o.earliest_arrival).toLocaleString()
                    : "unknown"}
                </p>
                <p>
                  Warranty:{" "}
                  {o.warranty_days != null ? `${o.warranty_days} days` : "unknown"}
                </p>
                <p>Parts included: {o.parts_included || "unclear"}</p>
                <Button onClick={() => book(o.id)}>Book this offer</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
