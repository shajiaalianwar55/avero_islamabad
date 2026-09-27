import type { SymptomIntake } from "./types";

export type SymptomShortcut = {
  id: string;
  label: string;
  family: string;
};

const RADIATOR_SHORTCUTS: SymptomShortcut[] = [
  { id: "not_heating", label: "Not heating", family: "no_heat" },
  { id: "wont_turn_on", label: "Won't turn on", family: "wont_power" },
  { id: "leaking", label: "Leaking liquid", family: "leak" },
  { id: "burn_smoke", label: "Burning smell / smoke", family: "burn_smoke" },
  { id: "noise", label: "Unusual noise", family: "noise" },
  { id: "hot_plug", label: "Hot plug / socket", family: "hot_plug" },
  { id: "trips_breaker", label: "Tripping breaker", family: "trips_breaker" },
  { id: "other", label: "Something else", family: "other" },
];

const SINK_SHORTCUTS: SymptomShortcut[] = [
  { id: "leak_under", label: "Water under the sink", family: "water_leak" },
  { id: "slow_drain", label: "Drains slowly", family: "slow_drain" },
  { id: "backup", label: "Water backing up", family: "backup" },
  { id: "drip_tap", label: "Tap / faucet dripping", family: "faucet_drip" },
  { id: "smell", label: "Bad smell from drain", family: "drain_smell" },
  { id: "other", label: "Something else", family: "other" },
];

const GENERIC_SHORTCUTS: SymptomShortcut[] = [
  { id: "not_working", label: "Not working / no power", family: "wont_power" },
  { id: "weak", label: "Works poorly / weakly", family: "weak" },
  { id: "leak", label: "Leaking", family: "leak" },
  { id: "noise", label: "Unusual noise", family: "noise" },
  { id: "smell_smoke", label: "Burning smell / smoke", family: "burn_smoke" },
  { id: "sparks", label: "Sparks or shock", family: "hot_plug" },
  { id: "other", label: "Something else", family: "other" },
];

export function symptomShortcutsForAppliance(applianceId: string): SymptomShortcut[] {
  if (applianceId === "radiator") return RADIATOR_SHORTCUTS;
  if (applianceId === "kitchen-sink") return SINK_SHORTCUTS;
  return GENERIC_SHORTCUTS;
}

function detectFamilyFromText(text: string, applianceId: string): string {
  const t = text.toLowerCase();
  if (/burn|smoke|scorch|fire|melt/.test(t)) return "burn_smoke";
  if (/spark|shock|hot\s*plug|hot\s*socket|buzzing\s*plug/.test(t)) return "hot_plug";
  if (/trip|breaker|fuse\s*blow/.test(t)) return "trips_breaker";
  if (/leak|drip|oil\s*spot|wet\s*floor|puddle/.test(t)) return "leak";
  if (/gurgle|bubble|hiss|rattle|noise|loud|click/.test(t)) return "noise";
  if (/won'?t\s*turn|dead|no\s*power|no\s*light|won'?t\s*start/.test(t)) return "wont_power";
  if (/not\s*heat|no\s*heat|cold|won'?t\s*warm|not\s*warm|no\s*warmth/.test(t)) {
    return "no_heat";
  }
  if (applianceId === "kitchen-sink") {
    if (/slow\s*drain|drains?\s*slow|clog/.test(t)) return "slow_drain";
    if (/backup|overflow|blocked/.test(t)) return "backup";
    if (/under\s*(the\s*)?sink|cabinet/.test(t)) return "water_leak";
  }
  return "other";
}

type FamilyProfile = {
  boosts: Record<string, number>;
  preferredTags: string[];
  suppressedTags: string[];
  safety: SymptomIntake["safety"];
};

function radiatorProfile(family: string): FamilyProfile {
  const suppressSafety = ["safety_burn", "safety_spark", "safety_wet", "symptom_repeat"];
  switch (family) {
    case "no_heat":
      return {
        boosts: {
          rad_thermostat_too_low: 1.5,
          rad_still_warming_up: 1.2,
          rad_heating_element_failed: 0.8,
          rad_timer_or_mode_off: 0.6,
          rad_unplugged_or_switch_off: 0.5,
          rad_fire_or_smoke_risk: -2,
          rad_electrical_hazard: -1.5,
        },
        preferredTags: ["heat", "power", "type"],
        suppressedTags: suppressSafety,
        safety: { emergency: false, caution: false },
      };
    case "wont_power":
      return {
        boosts: {
          rad_unplugged_or_switch_off: 1.5,
          rad_dead_socket_or_breaker: 1.5,
          rad_tip_over_safety: 0.8,
          rad_cord_or_plug_fault: 0.6,
          rad_fire_or_smoke_risk: -1.5,
        },
        preferredTags: ["power", "type"],
        suppressedTags: ["safety_burn", "symptom_repeat"],
        safety: { emergency: false, caution: false },
      };
    case "leak":
      return {
        boosts: {
          rad_oil_leak: 2,
          rad_hydronic_pipe_leak: 1.5,
          rad_electrical_hazard: 0.5,
          rad_thermostat_too_low: -1,
          rad_still_warming_up: -1,
        },
        preferredTags: ["leak", "type", "safety_wet"],
        suppressedTags: ["safety_burn", "symptom_repeat"],
        safety: {
          caution: true,
          emergency: false,
          reason: "Liquid leak reported — keep clear of electrics.",
        },
      };
    case "burn_smoke":
      return {
        boosts: {
          rad_fire_or_smoke_risk: 3,
          rad_electrical_hazard: 2,
          rad_cord_or_plug_fault: 1,
        },
        preferredTags: ["safety_burn"],
        suppressedTags: ["symptom_repeat"],
        safety: {
          emergency: true,
          caution: true,
          reason: "Burning smell or smoke reported for the radiator.",
        },
      };
    case "hot_plug":
      return {
        boosts: {
          rad_electrical_hazard: 3,
          rad_cord_or_plug_fault: 2.5,
          rad_fire_or_smoke_risk: 1.5,
        },
        preferredTags: ["safety_spark", "power"],
        suppressedTags: ["symptom_repeat"],
        safety: {
          emergency: true,
          caution: true,
          reason: "Hot plug or socket reported — electrical hazard.",
        },
      };
    case "trips_breaker":
      return {
        boosts: {
          rad_dead_socket_or_breaker: 1.5,
          rad_cord_or_plug_fault: 1.5,
          rad_electrical_hazard: 1.2,
          rad_heating_element_failed: 0.8,
        },
        preferredTags: ["power", "safety_spark"],
        suppressedTags: ["symptom_repeat"],
        safety: {
          caution: true,
          emergency: false,
          reason: "Breaker trips can signal an electrical fault — be careful.",
        },
      };
    case "noise":
      return {
        boosts: {
          rad_hydronic_airlock: 1.2,
          rad_still_warming_up: 0.5,
          rad_cord_or_plug_fault: 0.4,
        },
        preferredTags: ["noise", "type", "heat"],
        suppressedTags: ["safety_burn", "symptom_repeat"],
        safety: { emergency: false, caution: false },
      };
    default:
      return {
        boosts: {},
        preferredTags: ["type", "heat", "power"],
        suppressedTags: ["symptom_repeat"],
        safety: { emergency: false, caution: false },
      };
  }
}

function sinkProfile(family: string): FamilyProfile {
  switch (family) {
    case "water_leak":
    case "leak":
      return {
        boosts: {
          sink_supply_line_loose: 1.2,
          sink_ptrap_loose: 1,
          sink_water_near_electrical: 0.3,
        },
        preferredTags: ["leak", "safety_wet"],
        suppressedTags: ["symptom_repeat"],
        safety: { emergency: false, caution: false },
      };
    case "slow_drain":
    case "backup":
      return {
        boosts: {
          sink_ptrap_clog: 1.5,
          sink_deeper_drain_clog: 1.2,
          sink_vent_or_slow_drain: 1,
        },
        preferredTags: ["drain"],
        suppressedTags: ["symptom_repeat", "safety_burn"],
        safety: { emergency: false, caution: false },
      };
    case "burn_smoke":
    case "hot_plug":
      return {
        boosts: { sink_water_near_electrical: 2 },
        preferredTags: ["safety_wet"],
        suppressedTags: ["symptom_repeat"],
        safety: {
          emergency: true,
          caution: true,
          reason: "Hazard signs reported near sink area.",
        },
      };
    default:
      return {
        boosts: {},
        preferredTags: ["leak", "drain"],
        suppressedTags: ["symptom_repeat"],
        safety: { emergency: false, caution: false },
      };
  }
}

function genericProfile(family: string): FamilyProfile {
  if (family === "burn_smoke" || family === "hot_plug") {
    return {
      boosts: {},
      preferredTags: ["safety_burn", "safety_spark"],
      suppressedTags: ["symptom_repeat"],
      safety: {
        emergency: true,
        caution: true,
        reason: "Hazard signs reported for this appliance.",
      },
    };
  }
  return {
    boosts: {},
    preferredTags: ["general"],
    suppressedTags: ["symptom_repeat"],
    safety: { emergency: false, caution: false },
  };
}

export function parseSymptomIntake(input: {
  applianceId: string;
  text: string;
  shortcutId?: string;
}): SymptomIntake {
  const shortcuts = symptomShortcutsForAppliance(input.applianceId);
  const fromShortcut = input.shortcutId
    ? shortcuts.find((s) => s.id === input.shortcutId)
    : undefined;
  const rawText = (input.text || fromShortcut?.label || "").trim() || "Something is wrong";
  const family =
    fromShortcut?.family || detectFamilyFromText(rawText, input.applianceId);

  const profile =
    input.applianceId === "radiator"
      ? radiatorProfile(family)
      : input.applianceId === "kitchen-sink"
        ? sinkProfile(family)
        : genericProfile(family);

  // Free text can escalate even if shortcut was mild
  const textFamily = detectFamilyFromText(rawText, input.applianceId);
  let safety = { ...profile.safety };
  if (textFamily === "burn_smoke" || textFamily === "hot_plug") {
    const hazard = radiatorProfile(textFamily).safety;
    safety = {
      emergency: safety.emergency || hazard.emergency,
      caution: true,
      reason: hazard.reason || safety.reason,
    };
  }
  if (/water|liquid|oil/.test(rawText.toLowerCase()) && /plug|socket|wire|electric/.test(rawText.toLowerCase())) {
    safety = {
      emergency: true,
      caution: true,
      reason: "Liquid near electrical parts reported.",
    };
  }

  return {
    family,
    rawText,
    shortcutId: fromShortcut?.id ?? input.shortcutId,
    safety,
    hypothesisBoosts: profile.boosts,
    preferredTags: profile.preferredTags,
    suppressedTags: profile.suppressedTags,
  };
}
