import type { DiagnosticKnowledgeBase, RepairDomainId } from "../types";
import { kitchenSinkKb } from "./plumbing/kitchen-sink";
import { radiatorKb } from "./plumbing/radiator";
import {
  acStub,
  applianceStub,
  electricalStub,
  geyserStub,
  solarStub,
  structuralStub,
  upsStub,
  waterPumpStub,
} from "./stubs";

export const ALL_KNOWLEDGE_BASES: DiagnosticKnowledgeBase[] = [
  radiatorKb,
  kitchenSinkKb,
  electricalStub,
  acStub,
  applianceStub,
  geyserStub,
  waterPumpStub,
  upsStub,
  solarStub,
  structuralStub,
];

const byId = new Map(ALL_KNOWLEDGE_BASES.map((kb) => [kb.id, kb]));

/** Map demo appliance ids / categories → knowledge base. */
const APPLIANCE_TO_KB: Record<string, string> = {
  radiator: "plumbing.radiator",
  "kitchen-sink": "plumbing.kitchen_sink",
  "bedroom-ac": "ac.generic",
  "bathroom-geyser": "geyser.generic",
  "wall-socket": "electrical.generic",
  "water-pump": "water_pump.generic",
  fridge: "appliance.generic",
  washer: "appliance.generic",
  ups: "ups_inverter.generic",
  custom: "appliance.generic",
};

const CATEGORY_TO_KB: Record<string, string> = {
  plumbing: "plumbing.kitchen_sink",
  electrical: "electrical.generic",
  ac: "ac.generic",
  geyser: "geyser.generic",
  water_pump: "water_pump.generic",
  ups_inverter: "ups_inverter.generic",
  solar: "solar.generic",
  appliance: "appliance.generic",
  structural: "structural.generic",
};

export function getKnowledgeBase(id: string): DiagnosticKnowledgeBase | null {
  return byId.get(id) ?? null;
}

export function resolveKnowledgeBase(input: {
  applianceId?: string;
  category?: string;
  domain?: RepairDomainId;
  nameHint?: string;
}): DiagnosticKnowledgeBase {
  const hint = (input.nameHint || "").toLowerCase();
  if (/radiator|oil\s*heater|room\s*heater/.test(hint)) return radiatorKb;
  if (/sink|faucet|tap/.test(hint)) return kitchenSinkKb;

  if (input.applianceId && APPLIANCE_TO_KB[input.applianceId]) {
    return byId.get(APPLIANCE_TO_KB[input.applianceId])!;
  }
  if (input.category && CATEGORY_TO_KB[input.category]) {
    return byId.get(CATEGORY_TO_KB[input.category])!;
  }
  if (input.domain) {
    const match = ALL_KNOWLEDGE_BASES.find((k) => k.domain === input.domain);
    if (match) return match;
  }
  return applianceStub;
}

export { radiatorKb, kitchenSinkKb };
