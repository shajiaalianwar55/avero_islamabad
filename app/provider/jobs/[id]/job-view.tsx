"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProviderJobView({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState("CONFIRMED");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${jobId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setStatus(json.data.booking.status);
      });
  }, [jobId]);

  async function setJobStatus(next: string) {
    const res = await fetch(`/api/provider/jobs/${jobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const json = await res.json();
    if (json.ok) {
      setStatus(json.data.booking.status);
      setMessage(`Status → ${json.data.booking.status}`);
    } else {
      setMessage(json.error?.message || "Failed");
    }
  }

  async function completeJob() {
    const res = await fetch(`/api/provider/jobs/${jobId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ work_done: "Repair completed on site" }),
    });
    const json = await res.json();
    if (json.ok) {
      setStatus(json.data.booking.status);
      setMessage("Awaiting customer confirmation");
    }
  }

  async function requestExtra() {
    const res = await fetch(`/api/provider/jobs/${jobId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        change_order: {
          reason: "Drain pipe needs replacement",
          additional_amount: 1200,
          note: "Part cost + installation",
        },
      }),
    });
    const json = await res.json();
    setMessage(json.ok ? json.data.message : json.error?.message);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job {jobId.slice(0, 8)}…</CardTitle>
        <Badge variant="outline">{status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setJobStatus("TECHNICIAN_EN_ROUTE")}>
            En route
          </Button>
          <Button size="sm" onClick={() => setJobStatus("IN_PROGRESS")}>
            In progress
          </Button>
          <Button size="sm" onClick={completeJob}>
            Mark complete
          </Button>
          <Button size="sm" variant="secondary" onClick={requestExtra}>
            Request extra PKR 1,200
          </Button>
        </div>
        <Textarea placeholder="Optional job notes for the resident…" />
        {message && <p className="text-sm text-[var(--avero-muted)]">{message}</p>}
      </CardContent>
    </Card>
  );
}
