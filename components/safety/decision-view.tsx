"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="border-[var(--avero-danger)]">
        <CardHeader>
          <Badge variant="danger">Emergency</Badge>
          <CardTitle className="mt-2">Stop troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Hazard summary</p>
            <p className="text-[var(--avero-muted)]">
              {((safety?.hazard_codes as string[]) || []).join(", ") ||
                "High-risk condition detected"}
            </p>
          </div>
          <div>
            <p className="font-medium">Safe immediate actions</p>
            <ul className="list-disc pl-5">
              {((safety?.safe_immediate_actions as string[]) ||
                (safety?.safe_actions as string[]) ||
                []).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Prohibited</p>
            <ul className="list-disc pl-5">
              {((safety?.prohibited_actions as string[]) || []).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <p className="text-[var(--avero-muted)]">
            Avero is not a substitute for emergency services. Call qualified help now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge>{String(outcome || "Pending")}</Badge>
        <Badge variant="outline">
          Confidence: {String(decision?.confidence || "—")}
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Likely issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{String(decision?.likely_issue || "Still collecting facts")}</p>
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
          <p>
            <span className="font-medium">Next step: </span>
            {String(decision?.recommended_next_step || "—")}
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {(outcome === "DIY" || data.incident?.status === "DIY_ACTIVE") && (
          <Link href={`/incident/${incidentId}/diy`}>
            <Button>Start DIY guidance</Button>
          </Link>
        )}
        {(outcome === "TECHNICIAN" ||
          data.incident?.status === "TECHNICIAN_REQUIRED" ||
          data.incident?.status === "SERVICE_REQUESTED") && (
          <Button onClick={createRequest} disabled={creating}>
            {creating ? "Creating request…" : "Create structured request"}
          </Button>
        )}
        <Link href={`/incident/${incidentId}`}>
          <Button variant="secondary">Back to chat</Button>
        </Link>
      </div>
    </div>
  );
}
