"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceWaves } from "@/components/voice/voice-waves";
import {
  getSpeechRecognitionCtor,
  listenOnce,
  matchSpokenChoice,
  speak,
  stopSpeaking,
} from "@/lib/voice/browser-speech";
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
  type DiagnosticQuestion,
  type DiagnosticResult,
  type PathOutcome,
} from "@/lib/diagnostics";

type WaveState = "idle" | "speaking" | "listening";
type Phase = "boot" | "appliance" | "symptom" | "questions" | "decision" | "diy" | "done";

type AnswerRow = {
  question: string;
  answer: string;
};

type Choice = { id: string; label: string };

/**
 * Voice-first triage: same path as screen flow —
 * appliance → symptom intake → adaptive diagnostics → DIY / tech / emergency.
 */
export function VoiceTalkMode({ onExit }: { onExit: () => void }) {
  const router = useRouter();
  const [wave, setWave] = useState<WaveState>("idle");
  const [prompt, setPrompt] = useState("Starting talk mode…");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [statusLine, setStatusLine] = useState("");
  const [heard, setHeard] = useState("");
  const [phase, setPhase] = useState<Phase>("boot");
  const [appliance, setAppliance] = useState<ApplianceDef | null>(null);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [outcome, setOutcome] = useState<PathOutcome | null>(null);
  const [diyStep, setDiyStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const runRef = useRef({ cancelled: false });
  /** Tap-to-answer while listening */
  const tapResolveRef = useRef<((label: string) => void) | null>(null);
  /** Tap while Avero is still speaking — skip the rest of the utterance */
  const earlyAnswerRef = useRef<string | null>(null);

  const createAndRoute = useCallback(
    async (
      path: PathOutcome,
      app: ApplianceDef,
      ans: AnswerRow[],
      notes = "",
      sayFn: (t: string) => Promise<void>
    ) => {
      setBusy(true);
      const description = buildProblemSummary({
        applianceName: app.name,
        brand: app.brand,
        yearBought: app.yearBought,
        room: app.room,
        notes:
          notes ||
          (path === "EMERGENCY" ? "Hazard signs from voice triage" : "Voice talk mode"),
        answers: ans.map((a) => ({ question: a.question, answer: a.answer })),
      });
      const withHazard =
        path === "EMERGENCY"
          ? `${description}. Possible hazard: burning smell sparks or gas smell reported.`
          : description;

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: withHazard, area: "F-10" }),
      });
      const json = await res.json();
      if (!json.ok) {
        setBusy(false);
        await sayFn("Sorry, I could not save that. Please use the screen.");
        return;
      }
      const id = json.data.incident.id as string;

      if (path === "EMERGENCY") {
        await sayFn("Opening emergency guidance now.");
        router.push(`/incident/${id}/decision`);
        return;
      }

      const sr = await fetch(`/api/incidents/${id}/service-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((r) => r.json());

      await sayFn("Here are technician options for you.");
      if (sr.ok) {
        router.push(`/incident/${id}/providers?sr=${sr.data.serviceRequest.id}`);
      } else {
        router.push(`/incident/${id}/decision`);
      }
    },
    [router]
  );

  useEffect(() => {
    const run = { cancelled: false };
    runRef.current = run;

    if (
      !getSpeechRecognitionCtor() ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      setUnsupported(true);
      setPrompt("Voice talk needs Chrome or Edge with mic permission.");
      return () => {
        run.cancelled = true;
      };
    }

    const saySafe = async (text: string, keepChoices = false) => {
      if (run.cancelled) return;
      setPrompt(text);
      if (!keepChoices) setChoices([]);
      setStatusLine(keepChoices ? "Tap an option anytime — no need to wait" : "");
      setWave("speaking");
      await speak(text);
      if (!run.cancelled) setWave("idle");
    };

    const showAsk = (question: string, opts: Choice[]) => {
      earlyAnswerRef.current = null;
      setPrompt(question);
      setChoices(opts);
      setStatusLine("Tap an option anytime — no need to wait");
    };

    const hearSafe = async (): Promise<string> => {
      if (run.cancelled) return "";
      if (earlyAnswerRef.current) {
        const text = earlyAnswerRef.current;
        earlyAnswerRef.current = null;
        setHeard(text);
        setWave("idle");
        setStatusLine("");
        return text;
      }
      setWave("listening");
      setStatusLine("Listening… speak your choice, or tap an option");
      setHeard("");

      const spokenPromise = listenOnce({ timeoutMs: 14000 });
      const tappedPromise = new Promise<string>((resolve) => {
        tapResolveRef.current = resolve;
      });

      const result = await Promise.race([
        spokenPromise.then((t) => ({ source: "voice" as const, text: t })),
        tappedPromise.then((t) => ({ source: "tap" as const, text: t })),
      ]);

      tapResolveRef.current = null;
      if (run.cancelled) return "";

      // Prefer a tap that landed between speak ending and listen starting
      const text = (earlyAnswerRef.current || result.text).trim();
      earlyAnswerRef.current = null;
      setHeard(text);
      setWave("idle");
      setStatusLine("");
      return text;
    };

    const matchOption = <T extends { id: string; label: string }>(
      spoken: string,
      options: T[]
    ): T | null => {
      const normalized = spoken.replace(/^\d+\.\s*/, "");
      return (
        matchSpokenChoice(normalized, options) ||
        matchSpokenChoice(spoken, options) ||
        options.find(
          (o, idx) =>
            spoken === `${idx + 1}. ${o.label}` ||
            spoken === o.label ||
            lowerIncludesOption(spoken, o.label)
        ) ||
        null
      );
    };

    (async () => {
      await new Promise((r) => setTimeout(r, 100));
      if (run.cancelled) return;

      const applianceChoices: Choice[] = [
        ...DEMO_APPLIANCES.map((a) => ({
          id: a.id,
          label: `${a.brand} ${a.name}`,
        })),
        { id: "add-new", label: "Add a new appliance" },
      ];

      showAsk("Which appliance has a problem?", applianceChoices);
      await saySafe(
        "Hi, I'm Avero. Tell me which appliance has a problem. You can say radiator, kitchen sink, Gree A C, Dawlance fridge, Haier washing machine, or say add new.",
        true
      );
      if (run.cancelled) return;
      setPhase("appliance");

      let chosen: ApplianceDef | null = null;
      for (let attempt = 0; attempt < 3 && !chosen && !run.cancelled; attempt++) {
        showAsk("Which appliance has a problem?", applianceChoices);
        const spoken = await hearSafe();
        if (run.cancelled) return;
        if (!spoken) {
          await saySafe("I didn't catch that. Please say the appliance name again.", true);
          continue;
        }
        const lower = spoken.toLowerCase();
        if (/add|new|other|custom/.test(lower)) {
          setChoices([]);
          await saySafe("What brand is it? For example Haier, Dawlance, Gree, or Orient.");
          const brand = (await hearSafe()) || "Haier";
          if (run.cancelled) return;
          await saySafe("What should we call this appliance?");
          const name = (await hearSafe()) || "Home appliance";
          if (run.cancelled) return;
          await saySafe("What year was it bought? Say a year like twenty twenty three.");
          const yearSpoken = await hearSafe();
          const yearMatch = yearSpoken.match(/20\d{2}|19\d{2}/);
          chosen = {
            id: "custom",
            name: name.trim().slice(0, 40),
            brand: brand.trim().slice(0, 30),
            yearBought: yearMatch ? Number(yearMatch[0]) : 2023,
            category: "appliance",
            room: "Home",
            icon: "🏠",
            blurb: "Custom",
          };
          break;
        }
        chosen =
          DEMO_APPLIANCES.find((a) => {
            const n = a.name.toLowerCase();
            const brand = a.brand.toLowerCase();
            const full = `${brand} ${n}`;
            return (
              lower.includes(brand) ||
              lower.includes(n) ||
              lower.includes(full) ||
              spoken === `${a.brand} ${a.name}` ||
              n.split(/\s+/).some((w) => w.length > 3 && lower.includes(w)) ||
              (a.id === "radiator" && /radiator|heater|oil\s*filled/.test(lower)) ||
              (a.id === "bedroom-ac" && /\bac\b|air\s*con/.test(lower)) ||
              (a.id === "water-pump" && /pump|motor/.test(lower)) ||
              (a.id === "wall-socket" && /socket|outlet|plug/.test(lower)) ||
              (a.id === "kitchen-sink" && /sink|kitchen|faucet/.test(lower)) ||
              (a.id === "bathroom-geyser" && /geyser|heater|hot\s*water/.test(lower)) ||
              (a.id === "fridge" && /fridge|refrigerator/.test(lower)) ||
              (a.id === "washer" && /wash|laundry/.test(lower)) ||
              (a.id === "ups" && /\bups\b|inverter/.test(lower))
            );
          }) || null;

        if (!chosen) {
          await saySafe(
            `I heard ${spoken}. Please say a brand and appliance, or tap an option on screen.`,
            true
          );
        }
      }

      if (run.cancelled) return;
      if (!chosen) {
        await saySafe("Let's continue on the screen instead.");
        onExit();
        return;
      }

      setAppliance(chosen);
      setChoices([]);

      // --- Symptom intake (same as screen Problem stage) ---
      setPhase("symptom");
      const shortcuts = symptomShortcutsForAppliance(chosen.id);
      const symptomChoices: Choice[] = shortcuts.map((s, idx) => ({
        id: s.id,
        label: `${idx + 1}. ${s.label}`,
      }));
      const shortcutLines = shortcuts
        .map((s, idx) => `Option ${idx + 1}: ${s.label}`)
        .join(". ");

      showAsk("What's going wrong?", symptomChoices);
      await saySafe(
        `Okay, ${applianceLabel(chosen)}. What's going wrong? ${shortcutLines}. Or describe it in your own words.`,
        true
      );
      if (run.cancelled) return;

      let symptomText = "";
      let shortcutId: string | undefined;
      for (let tryN = 0; tryN < 3 && !symptomText && !run.cancelled; tryN++) {
        showAsk("What's going wrong?", symptomChoices);
        const spoken = await hearSafe();
        if (run.cancelled) return;
        if (!spoken) {
          await saySafe(
            "I didn't catch that. Say a symptom like not heating, or tap an option.",
            true
          );
          continue;
        }
        const matched = matchOption(spoken, shortcuts);
        if (matched) {
          shortcutId = matched.id;
          symptomText = matched.label;
        } else {
          // Free-form description — still drives intake via text parsing
          symptomText = spoken.replace(/^\d+\.\s*/, "").trim();
        }
      }

      if (run.cancelled) return;
      if (!symptomText) {
        await saySafe("Let's continue on the screen instead.");
        onExit();
        return;
      }

      setChoices([]);
      await saySafe(`Got it. ${symptomText}. I'll ask a few short follow-ups.`);
      if (run.cancelled) return;

      const intake = parseSymptomIntake({
        applianceId: chosen.id,
        text: symptomText,
        shortcutId,
      });
      const knowledge = resolveKnowledgeBase({
        applianceId: chosen.id,
        category: chosen.category,
        nameHint: `${chosen.brand} ${chosen.name}`,
      });
      let session = createSessionFromIntake(knowledge, intake);
      let step = nextStep(knowledge, session);
      const collected: AnswerRow[] = [
        { question: "What's going wrong?", answer: symptomText },
      ];

      // Immediate emergency from intake (e.g. burn/smoke)
      if (session.safety.emergency && step.stopped && step.outcome === "EMERGENCY") {
        setOutcome("EMERGENCY");
        setPhase("decision");
        await saySafe(
          "This sounds unsafe. Please stop DIY. I'm taking you to emergency guidance."
        );
        if (run.cancelled) return;
        await createAndRoute(
          "EMERGENCY",
          chosen,
          collected,
          intake.rawText,
          saySafe
        );
        return;
      }

      let questionCount = 0;
      while (!step.stopped && !run.cancelled) {
        setPhase("questions");
        setMcqIndex(questionCount);
        const q = step.question as DiagnosticQuestion;
        const opts: Choice[] = q.options.map((o, idx) => ({
          id: o.id,
          label: `${idx + 1}. ${o.label}`,
        }));
        const optionLines = q.options
          .map((o, idx) => `Option ${idx + 1}: ${o.label}`)
          .join(". ");

        showAsk(q.prompt, opts);
        await saySafe(`${q.prompt} ${optionLines}`, true);
        if (run.cancelled) return;

        let matched: (typeof q.options)[number] | null = null;
        for (let tryN = 0; tryN < 2 && !matched && !run.cancelled; tryN++) {
          showAsk(q.prompt, opts);
          const spoken = await hearSafe();
          if (run.cancelled) return;
          matched = matchOption(spoken, q.options);
          if (!matched) {
            await saySafe("Please say option one, two, or three — or tap an option.", true);
          }
        }
        if (!matched) matched = q.options[0]!;
        collected.push({ question: q.prompt, answer: matched.label });
        setChoices([]);
        await saySafe(`Got it. ${matched.label}.`);
        step = answerAndContinue(knowledge, step.session, q, matched.id);
        questionCount += 1;
      }

      if (run.cancelled) return;
      const result = step as DiagnosticResult;
      setOutcome(result.outcome);
      setPhase("decision");
      setChoices([]);

      if (result.outcome === "EMERGENCY") {
        await saySafe(
          "This sounds unsafe. Please stop DIY. I'm taking you to emergency guidance."
        );
        if (run.cancelled) return;
        await createAndRoute(
          "EMERGENCY",
          chosen,
          collected,
          result.explanation,
          saySafe
        );
        return;
      }

      if (result.outcome === "TECHNICIAN") {
        showAsk("A technician is the better next step.", [
          { id: "continue", label: "Continue to offers" },
          { id: "back", label: "Exit talk mode" },
        ]);
        await saySafe(
          `${result.explanation || "A technician is the better next step."} Say continue to see offers, or say back to leave talk mode.`,
          true
        );
        if (run.cancelled) return;
        const spoken = await hearSafe();
        if (run.cancelled) return;
        if (/back|cancel|stop|exit/.test(spoken.toLowerCase())) {
          onExit();
          return;
        }
        await createAndRoute(
          "TECHNICIAN",
          chosen,
          collected,
          result.explanation,
          saySafe
        );
        return;
      }

      // DIY path from diagnostic result
      await saySafe(
        result.explanation ||
          "This looks safe to try yourself. I'll guide you step by step. At any time say solved if it's fixed, or say technician if you need help."
      );
      if (run.cancelled) return;
      setPhase("diy");
      const diy = result.diySteps?.length
        ? result.diySteps
        : [
            {
              instruction: "Try the basic safe check for this appliance.",
              success_check: "Symptom improves with no new warning signs.",
            },
          ];

      const saveDiyToHistory = async () => {
        const description = buildProblemSummary({
          applianceName: chosen.name,
          brand: chosen.brand,
          yearBought: chosen.yearBought,
          room: chosen.room,
          notes: "Resolved via voice DIY",
          answers: collected.map((a) => ({
            question: a.question,
            answer: a.answer,
          })),
        });
        await fetch("/api/history/diy-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: `${description}. User confirmed DIY resolved.`,
            area: "F-10",
            appliance_name: `${chosen.brand} ${chosen.name}`,
            appliance_id: chosen.id,
            category: chosen.category,
            work_done:
              diy.map((s) => s.instruction).join(" → ") ||
              "Resolved with Avero voice DIY guidance",
          }),
        }).catch(() => null);
      };

      for (let i = 0; i < diy.length && !run.cancelled; i++) {
        setDiyStep(i);
        const diyChoices: Choice[] = [
          { id: "next", label: "Next step" },
          { id: "solved", label: "Issue solved" },
          { id: "tech", label: "Get a technician" },
        ];
        showAsk(diy[i]!.instruction, diyChoices);
        await saySafe(
          `Step ${i + 1}. ${diy[i]!.instruction} Success check: ${diy[i]!.success_check}. When ready, say next, solved, or technician.`,
          true
        );
        if (run.cancelled) return;
        const spoken = (await hearSafe()).toLowerCase();
        if (run.cancelled) return;
        if (/solved|fixed|done|working/.test(spoken)) {
          setChoices([]);
          await saySafe("Great — glad it's fixed. Opening your home history.");
          setPhase("done");
          await saveDiyToHistory();
          router.push("/history");
          return;
        }
        if (/tech|person|help|escalate|can't|cannot/.test(spoken)) {
          setChoices([]);
          await saySafe("Okay, switching to a technician.");
          await createAndRoute(
            "TECHNICIAN",
            chosen,
            collected,
            "Escalated from voice DIY",
            saySafe
          );
          return;
        }
      }

      if (run.cancelled) return;
      showAsk("Were the DIY steps enough?", [
        { id: "solved", label: "Issue solved" },
        { id: "tech", label: "Get a technician" },
      ]);
      await saySafe(
        "Those were all the DIY steps. Say solved if it worked, or technician if not.",
        true
      );
      if (run.cancelled) return;
      const final = (await hearSafe()).toLowerCase();
      if (run.cancelled) return;
      setChoices([]);
      if (/tech|person|help|not|no|still/.test(final)) {
        await createAndRoute(
          "TECHNICIAN",
          chosen,
          collected,
          "DIY unfinished via voice",
          saySafe
        );
      } else {
        await saySafe("Marked as solved. Opening history.");
        await saveDiyToHistory();
        router.push("/history");
      }
    })();

    return () => {
      run.cancelled = true;
      tapResolveRef.current = null;
      earlyAnswerRef.current = null;
      stopSpeaking();
    };
  }, [createAndRoute, onExit, router]);

  function leave() {
    runRef.current.cancelled = true;
    tapResolveRef.current = null;
    earlyAnswerRef.current = null;
    stopSpeaking();
    onExit();
  }

  function onTapChoice(choice: Choice) {
    if (busy || choices.length === 0) return;
    // Interrupt TTS mid-sentence and take the answer immediately
    if (wave === "speaking") {
      earlyAnswerRef.current = choice.label;
      setHeard(choice.label);
      stopSpeaking();
      return;
    }
    if (tapResolveRef.current) {
      tapResolveRef.current(choice.label);
      return;
    }
    // Brief gap between speak ending and listen starting
    earlyAnswerRef.current = choice.label;
    setHeard(choice.label);
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center px-4 py-6 text-center">
      <Badge variant="outline" className="mb-4">
        Talk mode
      </Badge>

      <div className="mb-2 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--avero-teal)]/40 bg-[var(--avero-panel)] shadow-sm">
        <VoiceWaves state={wave} />
      </div>

      <p className="mt-2 text-sm font-medium uppercase tracking-wider text-[var(--avero-teal)]">
        {wave === "speaking"
          ? "Avero speaking"
          : wave === "listening"
            ? "Your turn"
            : "Ready"}
      </p>

      <p className="mt-4 max-w-md text-lg font-medium text-[var(--avero-ink)]">{prompt}</p>

      {statusLine ? (
        <p className="mt-2 text-sm text-[var(--avero-teal)]">{statusLine}</p>
      ) : null}

      {choices.length > 0 ? (
        <ul className="mt-5 w-full max-w-md space-y-2 text-left">
          {choices.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onTapChoice(c)}
                disabled={busy}
                className="w-full rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] px-4 py-3 text-left text-sm text-[var(--avero-ink)] transition enabled:hover:border-[var(--avero-teal)] disabled:opacity-80"
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {heard ? (
        <p className="mt-3 text-sm text-[var(--avero-muted)]">Heard: “{heard}”</p>
      ) : null}

      {appliance ? (
        <p className="mt-2 text-xs text-[var(--avero-muted)]">
          {appliance.name} · {appliance.brand} · {appliance.yearBought}
          {phase === "symptom" ? " · Symptom" : ""}
          {phase === "questions" ? ` · Q${mcqIndex + 1}` : ""}
          {phase === "diy" ? ` · DIY step ${diyStep + 1}` : ""}
          {outcome ? ` · ${outcome}` : ""}
        </p>
      ) : null}

      {unsupported ? (
        <p className="mt-4 text-sm text-[var(--avero-alert)]">
          Use Chrome or Edge, allow the microphone, then try again — or stay on the
          screen flow.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={leave} disabled={busy}>
          Exit talk mode
        </Button>
        {phase === "diy" ? (
          <Button
            type="button"
            size="lg"
            disabled={busy}
            onClick={async () => {
              runRef.current.cancelled = true;
              stopSpeaking();
              if (appliance) {
                await fetch("/api/history/diy-complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    description: `${appliance.brand} ${appliance.name} — voice DIY marked solved`,
                    area: "F-10",
                    appliance_name: `${appliance.brand} ${appliance.name}`,
                    appliance_id: appliance.id,
                    category: appliance.category,
                    work_done: "Resolved with Avero voice DIY guidance",
                  }),
                }).catch(() => null);
              }
              router.push("/history");
            }}
          >
            Click if issue has been solved
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function lowerIncludesOption(spoken: string, label: string) {
  const t = spoken.toLowerCase();
  const words = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return words.filter((w) => t.includes(w)).length >= Math.min(2, words.length);
}
