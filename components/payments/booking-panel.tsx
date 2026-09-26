"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BookingData = {
  booking: {
    id: string;
    status: string;
    scheduled_for: string;
    change_order?: {
      reason: string;
      additional_amount: number;
      note: string;
      status: string;
    } | null;
  };
  payment?: { amount: number; state: string; is_demo: boolean } | null;
  offer?: { visit_fee?: number | null; warranty_days?: number | null } | null;
  provider?: { name: string } | null;
};

export function BookingPanel({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<BookingData | null>(null);

  async function refresh() {
    const res = await fetch(`/api/bookings/${bookingId}`);
    const json = await res.json();
    if (json.ok) setData(json.data);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const json = await res.json();
      if (!cancelled && json.ok) setData(json.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function confirmCompletion() {
    const res = await fetch(`/api/bookings/${bookingId}/confirm-completion`, {
      method: "POST",
    });
    const json = await res.json();
    if (json.ok) await refresh();
  }

  async function decideChange(decision: "Approve" | "Decline") {
    await fetch(`/api/bookings/${bookingId}/change-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await refresh();
  }

  if (!data) return <p className="text-[var(--avero-muted)]">Loading booking…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Protected payment (demo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Provider: {data.provider?.name || "—"}</p>
          <p>Estimated service: PKR {data.payment?.amount ?? "—"}</p>
          <p>
            Booking / visit charge: PKR {data.offer?.visit_fee ?? "—"}
          </p>
          <p>
            Warranty:{" "}
            {data.offer?.warranty_days != null
              ? `${data.offer.warranty_days} days`
              : "unknown"}
          </p>
          <p>
            Payment status: <Badge>{data.payment?.state || "PROTECTED"}</Badge>
          </p>
          <p>
            Booking status: <Badge variant="outline">{data.booking.status}</Badge>
          </p>
          <p className="text-[var(--avero-muted)]">
            Extra work requires approval. Provider is paid after completion confirmation
            in this demo — not licensed escrow.
          </p>
        </CardContent>
      </Card>

      {data.booking.change_order?.status === "pending" && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle>
              Additional work requested: PKR{" "}
              {data.booking.change_order.additional_amount}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{data.booking.change_order.reason}</p>
            <p className="text-[var(--avero-muted)]">{data.booking.change_order.note}</p>
            <div className="flex gap-2">
              <Button onClick={() => decideChange("Approve")}>Approve</Button>
              <Button variant="secondary" onClick={() => decideChange("Decline")}>
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/provider/jobs/${bookingId}`}>
          <Button variant="secondary">Provider job view</Button>
        </Link>
        <Button onClick={confirmCompletion}>Confirm repair completion</Button>
        <Link href="/history">
          <Button variant="outline">Home History</Button>
        </Link>
      </div>
    </div>
  );
}
