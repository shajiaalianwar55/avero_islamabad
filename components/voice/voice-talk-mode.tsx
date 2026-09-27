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
  APPLIANCE_DIY,
  APPLIANCE_MCQS,
  DEMO_APPLIANCES,
  buildProblemSummary,
  scoreOutcome,
  type ApplianceDef,
  type FlowOutcome,
} from "@/lib/demo/appliance-flows";

type WaveState = "idle" | "speaking" | "listening";
type Phase = "boot" | "appliance" | "questions" | "decision" | "diy" | "done";

type AnswerRow = {
  question: string;
  answer: string;
  scores: Partial<Record<FlowOutcome, number>>;
};

/**
 * Voice-first triage: Avero speaks, shows waves, listens for answers.
 * Chrome/Edge + mic permission. Screen flow remains the fallback.
 */
export function VoiceTalkMode({ onExit }: { onExit: () => void }) {
  const router = useRouter();
  const [wave, setWave] = useState<WaveState>("idle");
  const [caption, setCaption] = useState("Starting talk mode…");
  const [heard, setHeard] = useState("");
  const [phase, setPhase] = useState<Phase>("boot");
  const [appliance, setAppliance] = useState<ApplianceDef | null>(null);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [outcome, setOutcome] = useState<FlowOutcome | null>(null);
  const [diyStep, setDiyStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const runRef = useRef({ cancelled: false });

  const createAndRoute = useCallback(
    async (
      path: FlowOutcome,
      app: ApplianceDef,
      ans: AnswerRow[],
      notes = "",
      sayFn: (t: string) => Promise<void>
    ) => {
      setBusy(true);
      const description = buildProblemSummary({
        applianceName: app.name,
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
      setCaption("Voice talk needs Chrome or Edge with mic permission.");
      return () => {
        run.cancelled = true;
      };
    }

    const saySafe = async (text: string) => {
      if (run.cancelled) return;
      setCaption(text);
      setWave("speaking");
      await speak(text);
      if (!run.cancelled) setWave("idle");
    };

    const hearSafe = async () => {
      if (run.cancelled) return "";
      setWave("listening");
      setCaption("Listening… speak now");
      const text = await listenOnce({ timeoutMs: 10000 });
      if (run.cancelled) return "";
      setHeard(text);
      setWave("idle");
      return text;
    };

    (async () => {
      await new Promise((r) => setTimeout(r, 100));
      if (run.cancelled) return;

      await saySafe(
        "Hi, I'm Avero. Tell me which appliance has a problem. You can say kitchen sink, bedroom A C, bathroom geyser, wall socket, water pump, or say add new."
      );
      if (run.cancelled) return;
      setPhase("appliance");

      let chosen: ApplianceDef | null = null;
      for (let attempt = 0; attempt < 3 && !chosen && !run.cancelled; attempt++) {
        const spoken = await hearSafe();
        if (run.cancelled) return;
        if (!spoken) {
          await saySafe("I didn't catch that. Please say the appliance name again.");
          continue;
        }
        const lower = spoken.toLowerCase();
        if (/add|new|other|custom/.test(lower)) {
          await saySafe("What should we call this appliance?");
          const name = (await hearSafe()) || "Home appliance";
          if (run.cancelled) return;
          chosen = {
            id: "custom",
            name: name.trim().slice(0, 40),
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
            return (
              lower.includes(n) ||
              n.split(/\s+/).some((w) => w.length > 3 && lower.includes(w)) ||
              (a.id === "bedroom-ac" && /\bac\b|air\s*con/.test(lower)) ||
              (a.id === "water-pump" && /pump|motor/.test(lower)) ||
              (a.id === "wall-socket" && /socket|outlet|plug/.test(lower)) ||
              (a.id === "kitchen-sink" && /sink|kitchen/.test(lower)) ||
              (a.id === "bathroom-geyser" && /geyser|heater|hot\s*water/.test(lower))
            );
          }) || null;

        if (!chosen) {
          await saySafe(
            `I heard ${spoken}. Please say kitchen sink, bedroom A C, bathroom geyser, wall socket, or water pump.`
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
      await saySafe(
        `Okay, ${chosen.name}. I'll ask a few short questions. Answer with option one, two, or three, or say the answer in your own words.`
      );
      if (run.cancelled) return;

      const mcqs = APPLIANCE_MCQS[chosen.id] || APPLIANCE_MCQS.custom;
      const collected: AnswerRow[] = [];

      for (let i = 0; i < mcqs.length && !run.cancelled; i++) {
        setMcqIndex(i);
        setPhase("questions");
        const q = mcqs[i];
        const optionLines = q.options
          .map((o, idx) => `Option ${idx + 1}: ${o.label}`)
          .join(". ");
        await saySafe(`${q.question} ${optionLines}`);
        if (run.cancelled) return;

        let matched: (typeof q.options)[number] | null = null;
        for (let tryN = 0; tryN < 2 && !matched && !run.cancelled; tryN++) {
          const spoken = await hearSafe();
          if (run.cancelled) return;
          matched = matchSpokenChoice(spoken, q.options);
          if (!matched) await saySafe("Please say option one, two, or three.");
        }
        if (!matched) matched = q.options[0];
        collected.push({
          question: q.question,
          answer: matched.label,
          scores: matched.score,
        });
        await saySafe(`Got it. ${matched.label}.`);
      }

      if (run.cancelled) return;
      const result = scoreOutcome(
        collected.map((a) => ({ optionId: a.answer, scores: a.scores }))
      );
      setOutcome(result.outcome);
      setPhase("decision");

      if (result.outcome === "EMERGENCY") {
        await saySafe(
          "This sounds unsafe. Please stop DIY. I'm taking you to emergency guidance."
        );
        if (run.cancelled) return;
        await createAndRoute("EMERGENCY", chosen, collected, "", saySafe);
        return;
      }

      if (result.outcome === "TECHNICIAN") {
        await saySafe(
          "A technician is the better next step. Say continue to see offers, or say back to leave talk mode."
        );
        if (run.cancelled) return;
        const spoken = await hearSafe();
        if (run.cancelled) return;
        if (/back|cancel|stop|exit/.test(spoken.toLowerCase())) {
          onExit();
          return;
        }
        await createAndRoute("TECHNICIAN", chosen, collected, "", saySafe);
        return;
      }

      await saySafe(
        "This looks safe to try yourself. I'll guide you step by step. At any time say solved if it's fixed, or say technician if you need help."
      );
      if (run.cancelled) return;
      setPhase("diy");
      const diy = APPLIANCE_DIY[chosen.id] || APPLIANCE_DIY.custom;

      for (let i = 0; i < diy.length && !run.cancelled; i++) {
        setDiyStep(i);
        await saySafe(
          `Step ${i + 1}. ${diy[i].instruction} Success check: ${diy[i].success_check}. When ready, say next, solved, or technician.`
        );
        if (run.cancelled) return;
        const spoken = (await hearSafe()).toLowerCase();
        if (run.cancelled) return;
        if (/solved|fixed|done|working/.test(spoken)) {
          await saySafe("Great — glad it's fixed. Opening your home history.");
          setPhase("done");
          router.push("/history");
          return;
        }
        if (/tech|person|help|escalate|can't|cannot/.test(spoken)) {
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
      await saySafe(
        "Those were all the DIY steps. Say solved if it worked, or technician if not."
      );
      if (run.cancelled) return;
      const final = (await hearSafe()).toLowerCase();
      if (run.cancelled) return;
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
        router.push("/history");
      }
    })();

    return () => {
      run.cancelled = true;
      stopSpeaking();
    };
  }, [createAndRoute, onExit, router]);

  function leave() {
    runRef.current.cancelled = true;
    stopSpeaking();
    onExit();
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
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

      <p className="mt-4 max-w-md text-lg text-[var(--avero-ink)]">{caption}</p>

      {heard ? (
        <p className="mt-3 text-sm text-[var(--avero-muted)]">Heard: “{heard}”</p>
      ) : null}

      {appliance ? (
        <p className="mt-2 text-xs text-[var(--avero-muted)]">
          {appliance.name}
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
            onClick={() => {
              runRef.current.cancelled = true;
              stopSpeaking();
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
