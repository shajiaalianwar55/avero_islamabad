"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = {
  step_order?: number;
  order?: number;
  instruction: string;
  success_check: string;
};

export function DiyWizard({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [planTitle, setPlanTitle] = useState("");
  const [step, setStep] = useState<Step | null>(null);
  const [safetyNotes, setSafetyNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/incidents/${incidentId}/diy/start`, { method: "POST" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setPlanTitle(json.data.plan.title);
          setSafetyNotes(json.data.plan.safety_notes || []);
          setStep(json.data.currentStep);
        }
      })
      .finally(() => setLoading(false));
  }, [incidentId]);

  async function respond(response: "DONE" | "CANNOT" | "DIFFERENT" | "STOP") {
    if (!step) return;
    setBusy(true);
    const stepOrder = step.step_order ?? step.order ?? 1;
    const textMap = {
      DONE: "Done — success check passed",
      CANNOT: "Cannot do this step",
      DIFFERENT: "Something looks different than expected",
      STOP: "Stop DIY",
    };
    const res = await fetch(`/api/incidents/${incidentId}/diy/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_order: stepOrder, response: textMap[response] }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) return;

    const status = json.data.reassessment.status as string;
    if (status === "CONTINUE" && json.data.currentStep) {
      setStep(json.data.currentStep);
      return;
    }
    if (status === "RESOLVED") {
      router.push(`/history`);
      return;
    }
    if (status === "EMERGENCY") {
      router.push(`/incident/${incidentId}/decision`);
      return;
    }
    // escalate — create service request then offers
    const sr = await fetch(`/api/incidents/${incidentId}/service-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions_tried: ["DIY attempted"] }),
    }).then((r) => r.json());
    if (sr.ok) {
      router.push(
        `/incident/${incidentId}/providers?sr=${sr.data.serviceRequest.id}`
      );
    } else {
      router.push(`/incident/${incidentId}/decision`);
    }
  }

  if (loading) return <p className="text-[var(--avero-muted)]">Preparing DIY plan…</p>;

  const order = step?.step_order ?? step?.order;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{planTitle || "DIY guidance"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {safetyNotes.length > 0 && (
            <div className="rounded-md bg-amber-50 p-3 text-amber-900">
              <p className="font-medium">Safety notes</p>
              <ul className="list-disc pl-5">
                {safetyNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          {step && (
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--avero-muted)]">
                Step {order}
              </p>
              <p className="mt-1 text-base">{step.instruction}</p>
              <p className="mt-2 text-[var(--avero-muted)]">
                Success check: {step.success_check}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => respond("DONE")}>
          Done
        </Button>
        <Button disabled={busy} variant="secondary" onClick={() => respond("CANNOT")}>
          Cannot do this
        </Button>
        <Button disabled={busy} variant="secondary" onClick={() => respond("DIFFERENT")}>
          Something looks different
        </Button>
        <Button disabled={busy} variant="danger" onClick={() => respond("STOP")}>
          Stop
        </Button>
      </div>
    </div>
  );
}
