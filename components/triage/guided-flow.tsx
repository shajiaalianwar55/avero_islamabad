"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoProgress } from "@/components/demo/progress-steps";
import { VoiceTalkMode } from "@/components/voice/voice-talk-mode";
import { ISLAMABAD_AREAS } from "@/types";
import {
  DEMO_APPLIANCES,
  applianceLabel,
  buildProblemSummary,
  type ApplianceDef,
} from "@/lib/demo/appliance-flows";
import {
  answerAndContinue,
  createSessionFromIntake,
  nextStep,
  parseSymptomIntake,
  resolveKnowledgeBase,
  symptomShortcutsForAppliance,
  type DiagnosticKnowledgeBase,
  type DiagnosticQuestion,
  type DiagnosticResult,
  type DiagnosticSession,
  type PathOutcome,
  type SymptomShortcut,
} from "@/lib/diagnostics";
import { buildEmergencyCopy } from "@/lib/diagnostics/emergency-copy";
import { EmergencyDecisionPanel } from "@/components/safety/emergency-decision-panel";
import { rememberRepair, repairFromApi } from "@/lib/demo/client-history";

type Phase = "report" | "appliance" | "symptom" | "questions" | "decision" | "diy";

export function GuidedIncidentFlow() {
  const router = useRouter();
  const [talkMode, setTalkMode] = useState(false);
  const [phase, setPhase] = useState<Phase>("report");
  const [area, setArea] = useState("F-10");
  const [notes, setNotes] = useState("");
  const [appliance, setAppliance] = useState<ApplianceDef | null>(null);
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("Haier");
  const [customYear, setCustomYear] = useState(2023);
  const [customCategory, setCustomCategory] = useState("appliance");
  const [addingCustom, setAddingCustom] = useState(false);

  const [kb, setKb] = useState<DiagnosticKnowledgeBase | null>(null);
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosticQuestion | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [outcome, setOutcome] = useState<PathOutcome | null>(null);
  const [diyStep, setDiyStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symptomText, setSymptomText] = useState("");
  const [symptomShortcut, setSymptomShortcut] = useState<string | undefined>();

  const diySteps = result?.diySteps ?? [];
  const answerRows =
    result?.answers.map((a) => ({ question: a.prompt, answer: a.label })) ??
    session?.answers.map((a) => ({ question: a.prompt, answer: a.label })) ??
    [];

  const progressStep =
    phase === "report"
      ? "report"
      : phase === "appliance"
        ? "appliance"
        : phase === "symptom"
          ? "problem"
          : phase === "questions"
            ? "diagnose"
            : phase === "decision"
              ? outcome === "EMERGENCY"
                ? "emergency"
                : "decision"
              : phase === "diy"
                ? "diy"
                : "decision";

  const progressBranch =
    outcome === "EMERGENCY"
      ? "EMERGENCY"
      : outcome === "DIY" || phase === "diy"
        ? "DIY"
        : outcome === "TECHNICIAN"
          ? "TECHNICIAN"
          : "none";

  if (talkMode) {
    return (
      <div className="space-y-4">
        <DemoProgress current={progressStep} branch={progressBranch} />
        <VoiceTalkMode onExit={() => setTalkMode(false)} />
      </div>
    );
  }

  function selectAppliance(a: ApplianceDef) {
    setAppliance(a);
    setSymptomText("");
    setSymptomShortcut(undefined);
    setKb(null);
    setSession(null);
    setCurrentQuestion(null);
    setResult(null);
    setOutcome(null);
    setError(null);
    setPhase("symptom");
  }

  function beginDiagnosticsFromSymptom() {
    if (!appliance) return;
    const intake = parseSymptomIntake({
      applianceId: appliance.id,
      text: symptomText,
      shortcutId: symptomShortcut,
    });
    if (!symptomText.trim() && !symptomShortcut) {
      setError("Tell us what’s happening, or pick a symptom.");
      return;
    }

    const knowledge = resolveKnowledgeBase({
      applianceId: appliance.id,
      category: appliance.category,
      nameHint: `${appliance.brand} ${appliance.name}`,
    });
    const sess = createSessionFromIntake(knowledge, intake);
    setKb(knowledge);
    setError(null);
    setDiyStep(0);

    // Immediate safety gate from reported symptoms
    if (sess.safety.emergency) {
      const emergencyResult = nextStep(knowledge, sess);
      if (emergencyResult.stopped) {
        setSession(sess);
        setCurrentQuestion(null);
        setResult(emergencyResult);
        setOutcome("EMERGENCY");
        setPhase("decision");
        return;
      }
    }

    const step = nextStep(knowledge, sess);
    if (step.stopped) {
      setSession(sess);
      setCurrentQuestion(null);
      setResult(step);
      setOutcome(step.outcome);
      setPhase("decision");
      return;
    }
    setSession(step.session);
    setCurrentQuestion(step.question);
    setPhase("questions");
  }

  function addCustomAppliance() {
    if (!customName.trim()) return;
    selectAppliance({
      id: "custom",
      name: customName.trim(),
      brand: customBrand.trim() || "Unknown",
      yearBought: customYear,
      category: customCategory,
      room: "Home",
      icon: "🏠",
      blurb: "Custom appliance",
    });
    setAddingCustom(false);
  }

  function answerDiagnostic(optionId: string) {
    if (!kb || !session || !currentQuestion) return;
    const step = answerAndContinue(kb, session, currentQuestion, optionId);
    if (step.stopped) {
      setCurrentQuestion(null);
      setResult(step);
      setOutcome(step.outcome);
      setPhase("decision");
      return;
    }
    setSession(step.session);
    setCurrentQuestion(step.question);
  }

  async function continueTechnician() {
    if (!appliance || !outcome) return;
    setBusy(true);
    setError(null);
    try {
      const description = buildProblemSummary({
        applianceName: appliance.name,
        brand: appliance.brand,
        yearBought: appliance.yearBought,
        room: appliance.room,
        notes: [notes, result?.explanation].filter(Boolean).join(". "),
        answers: answerRows,
      });
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, area }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      const id = json.data.incident.id as string;

      const sr = await fetch(`/api/incidents/${id}/service-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((r) => r.json());

      if (sr.ok) {
        router.push(`/incident/${id}/providers?sr=${sr.data.serviceRequest.id}`);
      } else {
        router.push(`/incident/${id}/decision`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue");
      setBusy(false);
    }
  }

  async function continueEmergency() {
    if (!appliance) return;
    setBusy(true);
    setError(null);
    try {
      const description = buildProblemSummary({
        applianceName: appliance.name,
        brand: appliance.brand,
        yearBought: appliance.yearBought,
        room: appliance.room,
        notes:
          notes ||
          result?.explanation ||
          "Emergency signs reported during guided questions",
        answers: answerRows,
      });
      const withHazard = `${description}. Possible hazard: burning smell sparks or gas smell reported.`;
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: withHazard, area }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      router.push(`/incident/${json.data.incident.id}/decision`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue");
      setBusy(false);
    }
  }

  async function markSolved() {
    setBusy(true);
    setError(null);
    try {
      const description = buildProblemSummary({
        applianceName: appliance?.name || "Appliance",
        brand: appliance?.brand,
        yearBought: appliance?.yearBought,
        room: appliance?.room || "Home",
        notes: notes || "Resolved via guided DIY",
        answers: answerRows,
      });
      const res = await fetch("/api/history/diy-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `${description}. User confirmed DIY resolved.`,
          area,
          appliance_name: appliance
            ? `${appliance.brand} ${appliance.name}`
            : "Appliance",
          appliance_id: appliance?.id,
          category: appliance?.category,
          work_done:
            result?.diySteps?.map((s) => s.instruction).join(" → ") ||
            result?.explanation ||
            "Guided DIY completed",
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message || "Could not save to Home History");
      }
      if (json.data?.repair) {
        rememberRepair(repairFromApi(json.data.repair));
      }
      router.push("/history");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save to Home History");
      setBusy(false);
    }
  }

  async function escalateFromDiy() {
    setOutcome("TECHNICIAN");
    await continueTechnician();
  }

  const askedCount = session?.asked.length ?? result?.answers.length ?? 0;

  return (
    <div className="space-y-4">
      <DemoProgress current={progressStep} branch={progressBranch} />

      {phase === "report" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPhase("appliance")}
            className="w-full rounded-2xl border-2 border-[var(--avero-teal)] bg-[var(--avero-panel)] px-6 py-12 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--avero-teal)]">
              Start here
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--avero-ink)] md:text-4xl">
              Something broke? Tell us what&apos;s wrong.
            </h2>
            <p className="mt-3 max-w-xl text-[var(--avero-muted)]">
              Pick the appliance — Avero asks dynamic questions (not a fixed quiz) until DIY,
              technician, or emergency is clear.
            </p>
            <p className="mt-6 text-base font-semibold text-[var(--avero-teal)]">
              Tap to continue →
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTalkMode(true)}
            className="w-full rounded-2xl border border-[var(--avero-line)] bg-[var(--avero-panel)] px-6 py-8 text-left transition hover:border-[var(--avero-teal)]"
          >
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--avero-teal)]/10"
                aria-hidden
              >
                <span className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-[var(--avero-teal)]"
                      style={{ height: `${8 + (i % 3) * 6}px` }}
                    />
                  ))}
                </span>
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[var(--avero-teal)]">
                  Talk mode
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--avero-ink)]">
                  Just talk — Avero speaks and listens
                </p>
                <p className="mt-1 text-sm text-[var(--avero-muted)]">
                  Works best in Chrome or Edge with mic on.
                </p>
              </div>
            </div>
          </button>

          <div className="space-y-2">
            <Label htmlFor="area">Your Islamabad area</Label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-[var(--avero-line)] bg-white px-3 text-sm"
            >
              {ISLAMABAD_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Optional: describe what you noticed</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Radiator stays cold even on high…"
            />
          </div>
        </div>
      )}

      {phase === "appliance" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              Which appliance is it?
            </h2>
            <p className="mt-1 text-sm text-[var(--avero-muted)]">
              From this home — brand and year bought shown. Or add another.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DEMO_APPLIANCES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAppliance(a)}
                className="rounded-xl border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4 text-left transition hover:border-[var(--avero-teal)]"
              >
                <p className="text-2xl" aria-hidden>
                  {a.icon}
                </p>
                <p className="mt-2 font-semibold text-[var(--avero-ink)]">{a.brand}</p>
                <p className="text-sm text-[var(--avero-ink)]">{a.name}</p>
                <p className="mt-1 text-xs text-[var(--avero-muted)]">
                  {a.room} · Bought {a.yearBought}
                </p>
                <p className="mt-2 text-sm text-[var(--avero-muted)]">{a.blurb}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAddingCustom(true)}
              className="rounded-xl border-2 border-dashed border-[var(--avero-line)] p-4 text-left hover:border-[var(--avero-teal)]"
            >
              <p className="font-semibold text-[var(--avero-ink)]">+ Add another appliance</p>
              <p className="mt-1 text-sm text-[var(--avero-muted)]">
                Brand, name, and year bought — e.g. Orient AC 2024.
              </p>
            </button>
          </div>
          {addingCustom && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New appliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Brand (Pakistan market)</Label>
                  <select
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-[var(--avero-line)] bg-white px-3 text-sm"
                  >
                    {[
                      "Haier",
                      "Dawlance",
                      "Gree",
                      "Orient",
                      "PEL",
                      "Waves",
                      "Super Asia",
                      "NasGas",
                      "Delonghi",
                      "Samsung",
                      "LG",
                      "Other",
                    ].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Name / model</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Radiator, fridge, UPS"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Year bought</Label>
                  <Input
                    type="number"
                    min={1990}
                    max={2026}
                    value={customYear}
                    onChange={(e) => setCustomYear(Number(e.target.value) || 2023)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-[var(--avero-line)] bg-white px-3 text-sm"
                  >
                    {[
                      "appliance",
                      "plumbing",
                      "electrical",
                      "ac",
                      "geyser",
                      "water_pump",
                      "ups_inverter",
                      "solar",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={addCustomAppliance}>
                    Continue with this appliance
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setAddingCustom(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Button type="button" variant="outline" onClick={() => setPhase("report")}>
            Back
          </Button>
        </div>
      )}

      {phase === "symptom" && appliance && (
        <div className="space-y-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              What&apos;s happening with your {appliance.name.toLowerCase()}?
            </h2>
            <p className="mt-1 text-sm text-[var(--avero-muted)]">
              {appliance.brand} · Bought {appliance.yearBought}. Describe the problem in your own
              words, or tap a shortcut.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {symptomShortcutsForAppliance(appliance.id).map((s: SymptomShortcut) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={symptomShortcut === s.id ? "default" : "secondary"}
                onClick={() => {
                  setSymptomShortcut(s.id);
                  if (!symptomText.trim()) setSymptomText(s.label);
                }}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="symptom">Describe what you notice</Label>
            <Textarea
              id="symptom"
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={
                appliance.id === "radiator"
                  ? "e.g. It stays cold even on high, no burning smell…"
                  : "e.g. Water under the cabinet when I run the tap…"
              }
            />
          </div>
          {error && <p className="text-sm text-[var(--avero-danger)]">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" type="button" onClick={beginDiagnosticsFromSymptom}>
              Continue to diagnosis →
            </Button>
            <Button type="button" variant="outline" onClick={() => setPhase("appliance")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {phase === "questions" && appliance && currentQuestion && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {appliance.icon} {applianceLabel(appliance)}
            </Badge>
            <Badge variant="outline">{kb?.title}</Badge>
            <Badge>Diagnose · Q{askedCount + 1}</Badge>
          </div>
          <p className="text-xs text-[var(--avero-muted)]">
            Next question is chosen from your reported problem — not a fixed script.
          </p>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {currentQuestion.options.map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant="secondary"
                  className="h-auto justify-start whitespace-normal px-4 py-3 text-left"
                  onClick={() => answerDiagnostic(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </CardContent>
          </Card>
          <Button type="button" variant="outline" onClick={() => setPhase("symptom")}>
            Back
          </Button>
        </div>
      )}

      {phase === "decision" && outcome && appliance && result && outcome === "EMERGENCY" && (
        <div className="space-y-4">
          {error && <p className="text-sm text-[var(--avero-danger)]">{error}</p>}
          <EmergencyDecisionPanel
            copy={buildEmergencyCopy(result)}
            primaryBusy={busy}
            primaryLabel="Save to home history"
            onPrimary={continueEmergency}
            details={[
              {
                label: "Appliance",
                value: `${appliance.brand} ${appliance.name} · Bought ${appliance.yearBought} · ${appliance.room}`,
              },
              {
                label: "Top hypothesis",
                value: result.topHypothesis?.summary || result.topHypothesis?.label || "—",
              },
              {
                label: "Answers",
                value: result.answers.map((a) => a.label).join(" · ") || "—",
              },
              {
                label: "Also considered",
                value:
                  result.ranked
                    .slice(1, 4)
                    .map((r) => r.hypothesis.label)
                    .join("; ") || "—",
              },
              {
                label: "Stop reason",
                value: result.reason,
              },
            ]}
          />
        </div>
      )}

      {phase === "decision" && outcome && appliance && result && outcome !== "EMERGENCY" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={outcome === "DIY" ? "success" : "default"}>{outcome}</Badge>
            {result.topHypothesis && (
              <Badge variant="outline">{result.topHypothesis.label}</Badge>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                {outcome === "DIY"
                  ? "Safe to try a guided DIY fix"
                  : "A technician is the better next step"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--avero-muted)]">
              <p className="text-base text-[var(--avero-ink)]">{result.explanation}</p>
              {outcome === "DIY" && (
                <ul className="list-disc pl-5">
                  {result.answers.map((a) => (
                    <li key={`${a.questionId}-${a.optionId}`}>
                      <span className="text-[var(--avero-ink)]">{a.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {outcome === "TECHNICIAN" && result.topHypothesis && (
                <p>
                  Likely issue:{" "}
                  <strong className="text-[var(--avero-ink)]">
                    {result.topHypothesis.label}
                  </strong>
                  . {result.topHypothesis.summary}
                </p>
              )}
            </CardContent>
          </Card>
          {error && <p className="text-sm text-[var(--avero-danger)]">{error}</p>}
          <div className="rounded-lg border border-[var(--avero-teal)]/40 bg-[var(--avero-teal)]/5 p-4">
            {outcome === "DIY" && (
              <Button
                size="lg"
                onClick={() => {
                  setDiyStep(0);
                  setPhase("diy");
                }}
              >
                Start DIY guidance →
              </Button>
            )}
            {outcome === "TECHNICIAN" && (
              <Button size="lg" disabled={busy} onClick={continueTechnician}>
                {busy ? "Finding technicians…" : "See technician offers →"}
              </Button>
            )}
          </div>
        </div>
      )}

      {phase === "diy" && (
        <div className="relative space-y-4 pb-24">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">DIY</Badge>
            <Badge variant="outline">
              Step {diyStep + 1} of {Math.max(diySteps.length, 1)}
            </Badge>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                {diySteps[diyStep]?.instruction ||
                  "Try the simple checks suggested, then confirm if it helped."}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--avero-muted)]">
              Success check:{" "}
              {diySteps[diyStep]?.success_check || "Symptom improves with no new warning signs."}
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            {diyStep + 1 < diySteps.length ? (
              <Button size="lg" onClick={() => setDiyStep(diyStep + 1)}>
                Done — next step →
              </Button>
            ) : (
              <Button size="lg" disabled={busy} onClick={markSolved}>
                Finish DIY → History
              </Button>
            )}
            <Button variant="secondary" disabled={busy} onClick={escalateFromDiy}>
              Still not fixed — get a technician
            </Button>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--avero-line)] bg-[var(--avero-panel)]/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--avero-muted)]">
                Issue already fixed? You can leave DIY anytime.
              </p>
              <Button size="lg" disabled={busy} onClick={markSolved}>
                Click if issue has been solved
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
