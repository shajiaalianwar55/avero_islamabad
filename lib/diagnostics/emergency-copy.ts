import type { DiagnosticResult } from "./types";

export type EmergencyCopy = {
  title: string;
  explanation: string;
  doNow: string[];
  doNot: string[];
  whyFlagged: string;
};

/** Action-first copy for EMERGENCY decisions — keep short and concrete. */
export function buildEmergencyCopy(result: DiagnosticResult | null): EmergencyCopy {
  const reason = result?.explanation || "";
  const hyp = result?.topHypothesis;
  const lower = `${reason} ${hyp?.label || ""} ${hyp?.summary || ""}`.toLowerCase();

  if (/liquid|water|wet|oil/.test(lower) && /electric|plug|socket|cord/.test(lower)) {
    return {
      title: "Electrical hazard detected",
      explanation: "Liquid may be in contact with electrical parts.",
      doNow: [
        "Do not touch the plug, socket, or wet area.",
        "If you can do so safely, switch off power from the breaker.",
        "Keep others away from the area.",
      ],
      doNot: [
        "Do not unplug the appliance.",
        "Do not attempt a DIY repair.",
      ],
      whyFlagged: reason || "Liquid reported near an electrical connection.",
    };
  }

  if (/burn|smoke|scorch|fire/.test(lower)) {
    return {
      title: "Fire or smoke risk",
      explanation: "Burning smell, smoke, or scorching was reported.",
      doNow: [
        "If safe, cut power at the breaker — do not stay to investigate.",
        "Leave the room and keep others away.",
        "Call emergency services if smoke continues or you see flames.",
      ],
      doNot: [
        "Do not pour water on electrical equipment.",
        "Do not keep using the appliance.",
        "Do not open or repair the unit yourself.",
      ],
      whyFlagged: reason || "Burning smell, smoke, or scorch marks reported.",
    };
  }

  if (/spark|buzz|hot.*plug|discolour|discolor/.test(lower)) {
    return {
      title: "Electrical hazard detected",
      explanation: "Sparks, buzzing, or an overheating connection was reported.",
      doNow: [
        "Stay clear of the plug and socket.",
        "If you can do so safely, switch off power from the breaker.",
        "Keep others away from the area.",
      ],
      doNot: [
        "Do not touch or unplug if the plug is hot or sparking.",
        "Do not attempt a DIY repair.",
      ],
      whyFlagged: reason || "Unsafe electrical signs at the connection.",
    };
  }

  if (/gas|geyser/.test(lower)) {
    return {
      title: "Possible gas or geyser hazard",
      explanation: "A gas smell or geyser safety signal was reported.",
      doNow: [
        "Do not operate switches or lights if you smell gas.",
        "Ventilate if safe, leave the area, and keep others away.",
        "Call emergency services / your gas utility.",
      ],
      doNot: [
        "Do not light matches or use flames.",
        "Do not attempt DIY on gas equipment.",
      ],
      whyFlagged: reason || "Gas or geyser hazard signs reported.",
    };
  }

  return {
    title: hyp?.label || "Safety hazard detected",
    explanation:
      hyp?.summary ||
      reason ||
      "Avero blocked DIY because this situation looks unsafe.",
    doNow: [
      "Stop troubleshooting and keep clear of the hazard.",
      "If you can do so safely, isolate power or water at the main control.",
      "Keep others away from the area.",
    ],
    doNot: [
      "Do not attempt a DIY repair.",
      "Do not ignore ongoing sparks, smoke, gas smell, or flooding.",
    ],
    whyFlagged: reason || "Safety override triggered during diagnosis.",
  };
}
