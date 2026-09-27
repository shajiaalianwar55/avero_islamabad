"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";

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
  const router = useRouter();
  const [data, setData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        if (json.data.booking?.status === "COMPLETED") setDone(true);
        return;
      }
      setData(null);
      setError(
        json.error?.message ||
          "Booking not found. Demo data may have reset — book an offer again."
      );
    } catch {
      setData(null);
      setError("Could not load booking. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function completeDemoFlow() {
    setBusy(true);
    // Advance provider side then resident confirms — one click for smooth demos
    await fetch(`/api/provider/jobs/${bookingId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "TECHNICIAN_EN_ROUTE" }),
    }).catch(() => null);
    await fetch(`/api/provider/jobs/${bookingId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    }).catch(() => null);
    await fetch(`/api/provider/jobs/${bookingId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ work_done: "Demo repair completed" }),
    }).catch(() => null);
    await fetch(`/api/bookings/${bookingId}/confirm-completion`, {
      method: "POST",
    });
    await refresh();
    setBusy(false);
    setDone(true);
  }

  async function decideChange(decision: "Approve" | "Decline") {
    await fetch(`/api/bookings/${bookingId}/change-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await refresh();
  }

  if (loading && !data) {
    return <p className="text-[var(--avero-muted)]">Loading booking…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-3 rounded-lg border border-[var(--avero-danger)]/40 bg-red-50 p-4">
        <p className="text-sm text-[var(--avero-danger)]">
          {error || "Booking not found."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
          <Link href="/incident/new">
            <Button type="button" size="sm">
              Report again →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DemoProgress current={done ? "history" : "book"} branch="TECHNICIAN" />
      <Card>
        <CardHeader>
          <CardTitle>Booking secured</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Provider: {data.provider?.name || "—"}</p>
          <p>Estimated service: PKR {data.payment?.amount ?? "—"}</p>
          <p>Visit charge: PKR {data.offer?.visit_fee ?? "—"}</p>
          <p>
            Warranty:{" "}
            {data.offer?.warranty_days != null
              ? `${data.offer.warranty_days} days`
              : "unknown"}
          </p>
          <p>
            Payment: <Badge>{data.payment?.state || "PROTECTED"}</Badge>{" "}
            <span className="text-[var(--avero-muted)]">(demo — not licensed escrow)</span>
          </p>
          <p>
            Status: <Badge variant="outline">{data.booking.status}</Badge>
          </p>
        </CardContent>
      </Card>

      {data.booking.change_order?.status === "pending" && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle>
              Extra charge requested: PKR {data.booking.change_order.additional_amount}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{data.booking.change_order.reason}</p>
            <div className="flex gap-2">
              <Button onClick={() => decideChange("Approve")}>Approve</Button>
              <Button variant="secondary" onClick={() => decideChange("Decline")}>
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!done ? (
        <div className="rounded-lg border border-[var(--avero-teal)]/40 bg-[var(--avero-teal)]/5 p-4">
          <p className="text-sm font-medium">Finish the demo repair</p>
          <p className="mt-1 text-sm text-[var(--avero-muted)]">
            One click simulates technician completion + your confirmation, then opens Home
            History.
          </p>
          <Button
            className="mt-3"
            size="lg"
            disabled={busy}
            onClick={async () => {
              await completeDemoFlow();
              router.push("/history");
            }}
          >
            {busy ? "Completing…" : "Complete repair → Home History"}
          </Button>
          <div className="mt-3">
            <Link
              href={`/provider/jobs/${bookingId}`}
              className="text-xs text-[var(--avero-muted)] underline"
            >
              Or open provider job view manually
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="font-medium text-emerald-900">Repair completed</p>
          <Link href="/history">
            <Button className="mt-3" size="lg">
              View Home History →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
