"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";
import { rememberBooking } from "@/lib/demo/client-history";

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
  const urlSr = params.get("sr") || "";
  const [srId, setSrId] = useState(urlSr);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

  const ensureOffers = useCallback(async (serviceRequestId: string) => {
    await fetch("/api/demo/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_request_id: serviceRequestId }),
    });
    const res = await fetch(`/api/service-requests/${serviceRequestId}/offers`);
    const json = await res.json();
    if (!json.ok) {
      throw new Error(json.error?.message || "Could not load offers");
    }
    return json.data.offers as OfferRow[];
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setLoadError(null);

      try {
        let id = urlSr;

        if (id) {
          const check = await fetch(`/api/service-requests/${id}/offers`).then((r) =>
            r.json()
          );
          if (!check.ok) id = "";
        }

        if (!id) {
          const res = await fetch(`/api/incidents/${incidentId}/service-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const json = await res.json();
          if (!json.ok) {
            throw new Error(
              json.error?.message ||
                "Could not create a service request. Try reporting again."
            );
          }
          id = json.data.serviceRequest.id as string;
        }

        if (cancelled) return;
        setSrId(id);

        const rows = await ensureOffers(id);
        if (cancelled) return;
        setOffers(rows);
        if (!rows.length) {
          setLoadError("No offers matched yet. Try again in a moment.");
        }
      } catch (e) {
        if (!cancelled) {
          setOffers([]);
          setLoadError(
            e instanceof Error ? e.message : "Could not load offers."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [incidentId, urlSr, ensureOffers]);

  async function book(preferredOfferId: string) {
    setBookError(null);
    setBookingId(preferredOfferId || "booking");

    try {
      // One atomic server call — recovers stale offers without AI / extra hops
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: preferredOfferId || undefined,
          service_request_id: srId || undefined,
          incident_id: incidentId,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        rememberBooking({
          id: json.data.booking.id,
          provider_name: json.data.provider?.name ?? null,
          amount: json.data.payment?.amount ?? json.data.protection?.estimated_service ?? null,
          visit_fee: json.data.offer?.visit_fee ?? null,
          warranty_days: json.data.offer?.warranty_days ?? null,
          status: json.data.booking.status,
          scheduled_for: json.data.booking.scheduled_for,
        });
        router.push(`/booking/${json.data.booking.id}`);
        return;
      }
      setBookError(json.error?.message || "Could not book this offer.");
    } catch (e) {
      setBookError(
        e instanceof Error
          ? e.message
          : "Could not book this offer. Try again."
      );
    } finally {
      setBookingId(null);
    }
  }

  const recommended = offers.find((o) => o.badges?.includes("Recommended")) || offers[0];

  return (
    <div className="space-y-4">
      <DemoProgress current="book" branch="TECHNICIAN" />
      <p className="text-sm text-[var(--avero-muted)]">
        Compare offers, then book one.
      </p>

      {loading && offers.length === 0 && (
        <p className="rounded-md border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4 text-sm text-[var(--avero-teal)]">
          Matching Islamabad providers…
        </p>
      )}

      {loadError && (
        <p className="rounded-md border border-[var(--avero-danger)]/40 bg-red-50 px-3 py-2 text-sm text-[var(--avero-danger)]">
          {loadError}
        </p>
      )}

      {bookError && (
        <p className="rounded-md border border-[var(--avero-danger)]/40 bg-red-50 px-3 py-2 text-sm text-[var(--avero-danger)]">
          {bookError}
        </p>
      )}

      {recommended && (
        <div className="rounded-lg border border-[var(--avero-teal)] bg-[var(--avero-teal)]/5 p-4">
          <p className="text-sm font-medium">Recommended</p>
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
            {bookingId === recommended.offer.id || bookingId === "booking"
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
