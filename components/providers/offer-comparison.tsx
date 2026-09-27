"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";

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
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    const res = await fetch(`/api/service-requests/${id}/offers`);
    const json = await res.json();
    if (json.ok) setOffers(json.data.offers);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
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
          if (!cancelled) setSrId(id);
        }
      }
      if (!id || cancelled) {
        setLoading(false);
        return;
      }
      await load(id);
      // Auto-load demo offers quickly for smooth demos
      await new Promise((r) => setTimeout(r, 2500));
      if (cancelled) return;
      const current = await fetch(`/api/service-requests/${id}/offers`).then((r) =>
        r.json()
      );
      if (cancelled) return;
      if (current.ok && current.data.offers.length === 0) {
        await fetch("/api/demo/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service_request_id: id }),
        });
        await load(id);
      } else if (current.ok) {
        setOffers(current.data.offers);
      }
      if (!cancelled) setLoading(false);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [incidentId, srId, load]);

  async function loadDemo() {
    if (!srId) return;
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
    setBookingId(offerId);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_id: offerId }),
    });
    const json = await res.json();
    setBookingId(null);
    if (json.ok) router.push(`/booking/${json.data.booking.id}`);
  }

  const recommended = offers.find((o) => o.badges?.includes("Recommended")) || offers[0];

  return (
    <div className="space-y-4">
      <DemoProgress current="book" branch="TECHNICIAN" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--avero-muted)]">
          Compare offers, then book one. Demo quotes load automatically.
        </p>
        <Button variant="outline" size="sm" onClick={loadDemo} disabled={loading || !srId}>
          Reload demo offers
        </Button>
      </div>

      {loading && offers.length === 0 && (
        <p className="rounded-md border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4 text-sm text-[var(--avero-teal)]">
          Matching Islamabad providers and loading demo offers…
        </p>
      )}

      {recommended && (
        <div className="rounded-lg border border-[var(--avero-teal)] bg-[var(--avero-teal)]/5 p-4">
          <p className="text-sm font-medium">Recommended for the demo</p>
          <p className="mt-1 text-lg font-semibold">
            {recommended.provider?.name} · PKR{" "}
            {recommended.offer.estimated_total_min ?? "—"}
          </p>
          <Button
            className="mt-3"
            size="lg"
            disabled={bookingId !== null}
            onClick={() => book(recommended.offer.id)}
          >
            {bookingId === recommended.offer.id
              ? "Booking…"
              : "Book recommended offer →"}
          </Button>
        </div>
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
                  Earliest:{" "}
                  {o.earliest_arrival
                    ? new Date(o.earliest_arrival).toLocaleString()
                    : "unknown"}
                </p>
                <p>
                  Warranty:{" "}
                  {o.warranty_days != null ? `${o.warranty_days} days` : "unknown"}
                </p>
                <Button
                  variant="secondary"
                  disabled={bookingId !== null}
                  onClick={() => book(o.id)}
                >
                  Book this offer
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
