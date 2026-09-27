import type {
  DiagnosticKnowledgeBase,
  DiagnosticQuestion,
  Hypothesis,
  RepairDomainId,
} from "../types";

function opt(
  id: string,
  label: string,
  effects: Array<[string, number]>,
  safety?: { emergency?: boolean; caution?: boolean; reason?: string }
) {
  return {
    id,
    label,
    effects: effects.map(([hypothesisId, delta]) => ({ hypothesisId, delta })),
    safety,
  };
}

const unsure = () => opt("unsure", "I'm not sure", []);

/** Minimal viable KB so every domain can plug into the same engine. */
export function makeStubKb(input: {
  id: string;
  domain: RepairDomainId;
  title: string;
  diyId: string;
  techId: string;
  emergencyHint: string;
}): DiagnosticKnowledgeBase {
  const hypotheses: Hypothesis[] = [
    {
      id: input.diyId,
      label: "Simple safe check likely",
      summary: "A basic homeowner check may resolve this.",
      prior: 1,
      path: "DIY",
      diySteps: [
        {
          instruction: "Power/water off if relevant, then try the simplest reversible check for this device.",
          success_check: "Symptom improves with no new warning signs.",
        },
      ],
    },
    {
      id: input.techId,
      label: "Needs a technician",
      summary: "This likely needs a qualified technician.",
      prior: 1,
      path: "TECHNICIAN",
    },
    {
      id: `${input.domain}_hazard`,
      label: "Hazard signs",
      summary: input.emergencyHint,
      prior: 0.4,
      path: "TECHNICIAN",
    },
  ];

  const questions: DiagnosticQuestion[] = [
    {
      id: `${input.domain}_hazard_q`,
      prompt: "Any gas smell, smoke, sparks, or water on electrical parts?",
      priority: 1,
      options: [
        opt(
          "hazard_yes",
          "Yes",
          [[`${input.domain}_hazard`, 3], [input.diyId, -2]],
          { emergency: true, reason: input.emergencyHint }
        ),
        opt("hazard_no", "No", [[`${input.domain}_hazard`, -2], [input.diyId, 0.5]]),
        unsure(),
      ],
    },
    {
      id: `${input.domain}_urgency_q`,
      prompt: "Is this getting worse quickly or spreading?",
      priority: 2,
      options: [
        opt("worse_yes", "Yes — getting worse", [[input.techId, 2], [input.diyId, -1]]),
        opt("worse_no", "No — stable for now", [[input.diyId, 1], [input.techId, -0.5]]),
        unsure(),
      ],
    },
    {
      id: `${input.domain}_diy_ok_q`,
      prompt: "Are you comfortable trying a simple, safe check yourself?",
      priority: 3,
      options: [
        opt("diy_yes", "Yes", [[input.diyId, 2], [input.techId, -0.5]]),
        opt("diy_no", "No — prefer a technician", [[input.techId, 2], [input.diyId, -1]]),
        unsure(),
      ],
    },
  ];

  return {
    id: input.id,
    domain: input.domain,
    title: input.title,
    description: `Stub knowledge base for ${input.title} — expand with full hypotheses later.`,
    hypotheses,
    questions,
    config: { maxQuestions: 6, minLeaderScore: 3.5, confidenceMargin: 2 },
  };
}

export const electricalStub = makeStubKb({
  id: "electrical.generic",
  domain: "electrical",
  title: "Electrical",
  diyId: "elec_simple",
  techId: "elec_tech",
  emergencyHint: "Electrical hazard signs — stop DIY.",
});

export const acStub = makeStubKb({
  id: "ac.generic",
  domain: "ac",
  title: "Air conditioner",
  diyId: "ac_filter_simple",
  techId: "ac_tech",
  emergencyHint: "AC electrical/smoke hazard — stop DIY.",
});

export const applianceStub = makeStubKb({
  id: "appliance.generic",
  domain: "appliance",
  title: "Appliance",
  diyId: "appl_simple",
  techId: "appl_tech",
  emergencyHint: "Appliance fire/shock hazard — stop DIY.",
});

export const geyserStub = makeStubKb({
  id: "geyser.generic",
  domain: "geyser",
  title: "Geyser",
  diyId: "geyser_simple",
  techId: "geyser_tech",
  emergencyHint: "Gas smell or scorching at geyser — emergency.",
});

export const waterPumpStub = makeStubKb({
  id: "water_pump.generic",
  domain: "water_pump",
  title: "Water pump",
  diyId: "pump_simple",
  techId: "pump_tech",
  emergencyHint: "Burning smell or wet motor wiring — emergency.",
});

export const upsStub = makeStubKb({
  id: "ups_inverter.generic",
  domain: "ups_inverter",
  title: "UPS / inverter",
  diyId: "ups_simple",
  techId: "ups_tech",
  emergencyHint: "UPS smoke or swollen battery smell — emergency.",
});

export const solarStub = makeStubKb({
  id: "solar.generic",
  domain: "solar",
  title: "Solar",
  diyId: "solar_simple",
  techId: "solar_tech",
  emergencyHint: "Inverter smoke or shock risk — emergency.",
});

export const structuralStub = makeStubKb({
  id: "structural.generic",
  domain: "structural",
  title: "Structural / building",
  diyId: "struct_simple",
  techId: "struct_tech",
  emergencyHint: "Collapse or major leak risk — emergency.",
});
