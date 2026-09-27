"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";
import { EmergencyDecisionPanel } from "@/components/safety/emergency-decision-panel";
import type { EmergencyCopy } from "@/lib/diagnostics/emergency-copy";

export function DecisionView({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    incident?: { status: string; initial_description: string };
    decision?: Record<string, unknown> | null;
    messages?: Array<{ metadata?: Record<string, unknown>; content?: string }>;
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
    const doNow =
      (safety?.safe_immediate_actions as string[]) ||
      (safety?.safe_actions as string[]) ||
      [
        "Do not touch the hazard area.",
        "If you can do so safely, isolate power or water at the main control.",
        "Keep others away from the area.",
      ];
    const doNot =
      (safety?.prohibited_actions as string[]) || [
        "Do not attempt a DIY repair.",
        "Do not pour water on electrical equipment.",
      ];
    const copy: EmergencyCopy = {
      title: String(decision?.likely_issue || "Safety hazard detected"),
      explanation: String(
        (safety?.reason as string) ||
          decision?.recommended_next_step ||
          "Avero blocked DIY because this looks dangerous."
      ),
      doNow: doNow.slice(0, 4),
      doNot: doNot.slice(0, 3),
      whyFlagged: String(
        safety?.reason || data.incident?.initial_description || "Safety override."
      ).slice(0, 200),
    };

    return (
      <div className="space-y-4">
        <DemoProgress current="emergency" branch="EMERGENCY" />
        <EmergencyDecisionPanel
          copy={copy}
          details={[
            {
              label: "Report",
              value: data.incident?.initial_description || "—",
            },
            {
              label: "Observed facts",
              value: ((decision?.observed_facts as string[]) || []).join(" · ") || "—",
            },
            {
              label: "Concerns",
              value: ((decision?.concerns as string[]) || []).join(" · ") || "—",
            },
          ]}
        />
        <Link href="/incident/new">
          <Button variant="ghost" size="sm">
            Report another problem
          </Button>
        </Link>
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
      <DemoProgress
        current="decision"
        branch={isDiy ? "DIY" : isTech ? "TECHNICIAN" : "none"}
      />
      <div className="flex flex-wrap gap-2">
        <Badge>{String(outcome || "Pending")}</Badge>
        {decision?.confidence != null && (
          <Badge variant="outline">Confidence: {String(decision.confidence)}</Badge>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>What Avero decided</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-base font-medium text-[var(--avero-ink)]">
            {String(decision?.likely_issue || "Still collecting facts")}
          </p>
          {isDiy && (
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
          )}
          {isTech && (
            <p className="text-[var(--avero-muted)]">
              {String(decision?.recommended_next_step || "A technician should inspect this.")}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-[var(--avero-teal)]/40 bg-[var(--avero-teal)]/5 p-4">
        <div className="flex flex-wrap gap-2">
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
