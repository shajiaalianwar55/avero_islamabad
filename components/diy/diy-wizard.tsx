"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";

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

  async function respond(response: "DONE" | "CANNOT" | "DIFFERENT" | "STOP" | "SOLVED") {
    if (!step) return;
    setBusy(true);
    const stepOrder = step.step_order ?? step.order ?? 1;
    const textMap = {
      DONE: "Done — success check passed",
      CANNOT: "Cannot do this step",
      DIFFERENT: "Something looks different than expected",
      STOP: "Stop DIY",
      SOLVED: "Issue has been solved — user confirmed fixed",
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
    <div className="relative space-y-4 pb-24">
      <DemoProgress forceStep={4} />
      <Card>
        <CardHeader>
          <CardTitle>{planTitle || "DIY guidance"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-[var(--avero-muted)]">
            One step at a time. Tap Done when the success check passes.
          </p>
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
              <p className="mt-1 text-base font-medium">{step.instruction}</p>
              <p className="mt-2 text-[var(--avero-muted)]">
                Success check: {step.success_check}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button size="lg" disabled={busy} onClick={() => respond("DONE")}>
          Done — next step →
        </Button>
        <Button disabled={busy} variant="secondary" onClick={() => respond("CANNOT")}>
          Can&apos;t do this
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => respond("DIFFERENT")}>
          Looks different
        </Button>
        <Button disabled={busy} variant="danger" onClick={() => respond("STOP")}>
          Still not fixed — get a technician
        </Button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--avero-line)] bg-[var(--avero-panel)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--avero-muted)]">
            Issue already fixed? You can leave DIY anytime.
          </p>
          <Button size="lg" disabled={busy} onClick={() => respond("SOLVED")}>
            Click if issue has been solved
          </Button>
        </div>
      </div>
    </div>
  );
}
