import type { SafetyAssessment } from "@/types";

/**
 * Deterministic high-risk patterns for the safety gate (spec §10).
 */
export const HIGH_RISK_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  { code: "gas_smell", pattern: /smell.*gas|gas.*smell|gas\s*leak/i },
  { code: "burning_smell", pattern: /burning.*smell|smell.*burning|burning\s*odor/i },
  { code: "smoke", pattern: /\bsmoke\b|smouldering|smoldering/i },
  { code: "sparks", pattern: /\bspark(s|ing)?\b|arcing/i },
  { code: "visible_flame", pattern: /\bflame\b|\bfire\b|on\s*fire/i },
  { code: "exposed_wire", pattern: /exposed.*wire|live\s*wir|bare\s*wir/i },
  { code: "water_socket", pattern: /water.*socket|socket.*water|water.*outlet|outlet.*water/i },
  { code: "flooding_electrical", pattern: /flood.*(electric|socket|wire)|standing\s*water.*(electric|socket)/i },
  { code: "carbon_monoxide", pattern: /carbon\s*monoxide|\bCO\s*alarm|co\s*detector/i },
  { code: "structural_collapse", pattern: /ceiling\s*(crack|falling|collaps)|structural\s*collaps/i },
  { code: "overheating_device", pattern: /overheat|too\s*hot\s*to\s*touch|melting\s*(plastic|wire)/i },
  { code: "buzzing_burning", pattern: /buzzing.*burn|burn.*buzz|socket.*buzz/i },
];

export function assessSafetyRules(text: string): SafetyAssessment {
  const matched = HIGH_RISK_PATTERNS.filter((p) => p.pattern.test(text));
  const hazard_codes = matched.map((m) => m.code);

  if (hazard_codes.length === 0) {
    return {
      level: "normal",
      hazard_codes: [],
      stop_troubleshooting: false,
      safe_immediate_actions: [],
      prohibited_actions: [],
    };
  }

  const isEmergency = hazard_codes.some((c) =>
    [
      "gas_smell",
      "smoke",
      "visible_flame",
      "exposed_wire",
      "water_socket",
      "flooding_electrical",
      "carbon_monoxide",
      "structural_collapse",
      "buzzing_burning",
      "burning_smell",
      "sparks",
      "overheating_device",
    ].includes(c)
  );

  if (isEmergency) {
    return {
      level: "emergency",
      hazard_codes,
      stop_troubleshooting: true,
      safe_immediate_actions: [
        "Leave the immediate area if unsafe",
        "Switch off the main breaker only if you can reach it safely without touching water or damaged wiring",
        "Open windows for ventilation if there is a gas or smoke smell and it is safe to do so",
        "Call a licensed professional / emergency services if danger is immediate",
      ],
      prohibited_actions: [
        "Do not continue DIY troubleshooting",
        "Do not touch sockets, switches, or exposed wires",
        "Do not use water on electrical hazards",
        "Do not operate electrical appliances in the affected area",
      ],
    };
  }

  return {
    level: "caution",
    hazard_codes,
    stop_troubleshooting: false,
    safe_immediate_actions: [
      "Pause and reassess before continuing",
      "Keep children and pets away from the area",
    ],
    prohibited_actions: [
      "Do not ignore new hazard signs (smoke, sparks, burning smell)",
    ],
  };
}

export function mergeSafetyAssessments(
  rules: SafetyAssessment,
  ai: SafetyAssessment
): SafetyAssessment {
  const levelRank = { normal: 0, caution: 1, emergency: 2 } as const;
  const level =
    levelRank[rules.level] >= levelRank[ai.level] ? rules.level : ai.level;

  const hazard_codes = Array.from(
    new Set([...rules.hazard_codes, ...ai.hazard_codes])
  );

  return {
    level,
    hazard_codes,
    stop_troubleshooting:
      rules.stop_troubleshooting ||
      ai.stop_troubleshooting ||
      level === "emergency",
    safe_immediate_actions: Array.from(
      new Set([...rules.safe_immediate_actions, ...ai.safe_immediate_actions])
    ),
    prohibited_actions: Array.from(
      new Set([...rules.prohibited_actions, ...ai.prohibited_actions])
    ),
  };
}

/** Alias used by triage pipeline */
export const mergeSafety = mergeSafetyAssessments;
