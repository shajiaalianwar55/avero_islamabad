"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";
import {
  rememberRepair,
  repairFromApi,
  readLastBooking,
} from "@/lib/demo/client-history";

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

      // Recover from browser snapshot if server demo store wiped
      const local = readLastBooking();
      if (local && local.id === bookingId) {
        setData({
          booking: {
            id: local.id,
            status: local.status || "CONFIRMED",
            scheduled_for: local.scheduled_for || new Date().toISOString(),
          },
          payment: {
            amount: local.amount ?? 0,
            state: "PROTECTED",
            is_demo: true,
          },
          offer: {
            visit_fee: local.visit_fee ?? null,
            warranty_days: local.warranty_days ?? null,
          },
          provider: { name: local.provider_name || "Provider" },
        });
        setError(null);
        return;
      }

      setData(null);
      setError(json.error?.message || "Booking not found.");
    } catch {
      const local = readLastBooking();
      if (local && local.id === bookingId) {
        setData({
          booking: {
            id: local.id,
            status: local.status || "CONFIRMED",
            scheduled_for: local.scheduled_for || new Date().toISOString(),
          },
          payment: {
            amount: local.amount ?? 0,
            state: "PROTECTED",
            is_demo: true,
          },
          offer: {
            visit_fee: local.visit_fee ?? null,
            warranty_days: local.warranty_days ?? null,
          },
          provider: { name: local.provider_name || "Provider" },
        });
        return;
      }
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
    const confirmRes = await fetch(`/api/bookings/${bookingId}/confirm-completion`, {
      method: "POST",
    });
    const confirmJson = await confirmRes.json().catch(() => null);
    if (confirmJson?.ok && confirmJson.data?.repair) {
      rememberRepair(repairFromApi(confirmJson.data.repair));
    } else if (data) {
      // Server booking gone — still record history locally so the demo completes
      rememberRepair({
        id: `local-${bookingId}`,
        title: `${data.provider?.name || "Technician"} visit`,
        work_done: "Demo repair completed",
        provider_name: data.provider?.name ?? null,
        amount_paid: data.payment?.amount ?? null,
        completed_at: new Date().toISOString(),
        warranty_days: data.offer?.warranty_days ?? 30,
        warranty_remaining_days: data.offer?.warranty_days ?? 30,
      });
    }
    setBusy(false);
    setDone(true);
    router.push("/history");
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
        <p className="text-sm text-[var(--avero-muted)]">
          Your booking may already be in Home History. Open history, or report again.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
          <Link href="/history">
            <Button type="button" size="sm">
              Open Home History →
            </Button>
          </Link>
          <Link href="/incident/new">
            <Button type="button" variant="secondary" size="sm">
              Report again
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

      {!done ? (
        <div className="rounded-lg border border-[var(--avero-teal)]/40 bg-[var(--avero-teal)]/5 p-4">
          <p className="text-sm font-medium">Finish the demo repair</p>
          <p className="mt-1 text-sm text-[var(--avero-muted)]">
            One click marks the job done and opens Home History.
          </p>
          <Button
            className="mt-3"
            size="lg"
            disabled={busy}
            onClick={() => void completeDemoFlow()}
          >
            {busy ? "Completing…" : "Complete repair → Home History"}
          </Button>
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
