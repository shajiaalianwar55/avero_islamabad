"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";

export function DecisionView({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    incident?: { status: string; initial_description: string };
    decision?: Record<string, unknown> | null;
    messages?: Array<{ metadata?: Record<string, unknown> }>;
  } | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/incidents?id=${incidentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
      });
  }, [incidentId]);

  const decisionFromMsg = [...(data?.messages ?? [])]
    .reverse()
    .find((m) => m.metadata && (m.metadata as { decision?: unknown }).decision);
  const decision =
    data?.decision ||
    (decisionFromMsg?.metadata as { decision?: Record<string, unknown> } | undefined)
      ?.decision;
  const safety = (decisionFromMsg?.metadata as { safety?: Record<string, unknown> } | undefined)
    ?.safety;

  const outcome =
    (decision?.outcome as string) ||
    (data?.incident?.status === "EMERGENCY" ? "EMERGENCY" : data?.incident?.status);

  async function createRequest() {
    setCreating(true);
    const res = await fetch(`/api/incidents/${incidentId}/service-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    setCreating(false);
    if (json.ok) {
      router.push(
        `/incident/${incidentId}/providers?sr=${json.data.serviceRequest.id}`
      );
    }
  }

  if (!data) {
    return <p className="text-[var(--avero-muted)]">Loading decision…</p>;
  }

  if (outcome === "EMERGENCY" || data.incident?.status === "EMERGENCY") {
    return (
      <div className="space-y-4">
        <DemoProgress forceStep={3} />
        <Card className="border-[var(--avero-danger)]">
          <CardHeader>
            <Badge variant="danger">Emergency</Badge>
            <CardTitle className="mt-2">Stop troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-base text-[var(--avero-ink)]">
              Avero blocked DIY because this looks dangerous.
            </p>
            <div>
              <p className="font-medium">Do this now</p>
              <ul className="mt-1 list-disc pl-5">
                {((safety?.safe_immediate_actions as string[]) ||
                  (safety?.safe_actions as string[]) ||
                  [
                    "Leave the area if smoke or sparks continue",
                    "Do not touch the socket",
                    "Call a licensed electrician or emergency services",
                  ]
                ).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Do not</p>
              <ul className="mt-1 list-disc pl-5 text-[var(--avero-muted)]">
                {((safety?.prohibited_actions as string[]) || [
                  "Do not attempt DIY repairs",
                  "Do not pour water on electrical equipment",
                ]).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <p className="text-[var(--avero-muted)]">
              Avero is not a substitute for emergency services.
            </p>
            <Link href="/incident/new">
              <Button variant="secondary">Report another problem</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDiy = outcome === "DIY" || data.incident?.status === "DIY_ACTIVE";
  const isTech =
    outcome === "TECHNICIAN" ||
    data.incident?.status === "TECHNICIAN_REQUIRED" ||
    data.incident?.status === "SERVICE_REQUESTED";

  return (
    <div className="space-y-4">
      <DemoProgress forceStep={3} />
      <div className="flex flex-wrap gap-2">
        <Badge>{String(outcome || "Pending")}</Badge>
        <Badge variant="outline">
          Confidence: {String(decision?.confidence || "—")}
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>What Avero decided</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-base font-medium text-[var(--avero-ink)]">
            {String(decision?.likely_issue || "Still collecting facts")}
          </p>
          <div>
            <p className="font-medium">Observed facts</p>
            <ul className="list-disc pl-5 text-[var(--avero-muted)]">
              {(
                (decision?.observed_facts as string[]) || [
                  data.incident?.initial_description || "",
                ]
              ).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Concerns</p>
            <ul className="list-disc pl-5 text-[var(--avero-muted)]">
              {((decision?.concerns as string[]) || []).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-[var(--avero-teal)]/40 bg-[var(--avero-teal)]/5 p-4">
        <p className="text-sm font-medium text-[var(--avero-ink)]">Continue the demo</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {isDiy && (
            <Link href={`/incident/${incidentId}/diy`}>
              <Button size="lg">Start DIY guidance →</Button>
            </Link>
          )}
          {isTech && (
            <Button size="lg" onClick={createRequest} disabled={creating}>
              {creating ? "Preparing offers…" : "See technician offers →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
