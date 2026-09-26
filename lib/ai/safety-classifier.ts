import { z } from "zod";
import { completeValidatedJson, detectFixture } from "@/lib/ai/provider";
import type { SafetyAssessment } from "@/types";

const safetySchema: z.ZodType<SafetyAssessment> = z.object({
  level: z.enum(["normal", "caution", "emergency"]),
  hazard_codes: z.array(z.string()),
  stop_troubleshooting: z.boolean(),
  safe_immediate_actions: z.array(z.string()),
  prohibited_actions: z.array(z.string()),
});

export function fallbackSafetyClassifier(text: string): SafetyAssessment {
  const fixture = detectFixture(text);
  if (fixture === "buzzing_socket") {
    return {
      level: "emergency",
      hazard_codes: ["burning_smell", "electrical_buzz", "socket_hazard"],
      stop_troubleshooting: true,
      safe_immediate_actions: [
        "Do not touch the socket",
        "Turn off the breaker if reachable safely",
        "Evacuate the area if smoke appears",
        "Call a licensed electrician immediately",
      ],
      prohibited_actions: [
        "Do not continue DIY",
        "Do not plug/unplug devices in that socket",
        "Do not use water",
      ],
    };
  }

  if (/gas|smoke|spark|flame|exposed\s*wire|flood/.test(text.toLowerCase())) {
    return {
      level: "emergency",
      hazard_codes: ["ai_detected_hazard"],
      stop_troubleshooting: true,
      safe_immediate_actions: ["Stop troubleshooting", "Seek professional help"],
      prohibited_actions: ["Do not attempt DIY repairs"],
    };
  }

  return {
    level: "normal",
    hazard_codes: [],
    stop_troubleshooting: false,
    safe_immediate_actions: [],
    prohibited_actions: [],
  };
}

export async function classifySafety(text: string): Promise<SafetyAssessment> {
  return completeValidatedJson({
    system: `You are Avero's safety classifier for home incidents in Islamabad.
Flag gas, smoke, sparks, burning electrical smell, exposed wiring, water+electricity, CO, collapse, overheating.
Return JSON matching SafetyAssessment. If unsure but serious, prefer caution/emergency.`,
    user: text,
    schema: safetySchema,
    fallback: () => fallbackSafetyClassifier(text),
  });
}
