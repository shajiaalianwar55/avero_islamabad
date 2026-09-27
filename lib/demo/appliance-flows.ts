export type FlowOutcome = "DIY" | "TECHNICIAN" | "EMERGENCY";

export type ApplianceDef = {
  id: string;
  name: string;
  category: string;
  room: string;
  icon: string;
  blurb: string;
};

export type Mcq = {
  id: string;
  question: string;
  options: Array<{ id: string; label: string; score: Partial<Record<FlowOutcome, number>> }>;
};

export type DiyGuideStep = {
  order: number;
  instruction: string;
  success_check: string;
};

export const DEMO_APPLIANCES: ApplianceDef[] = [
  {
    id: "kitchen-sink",
    name: "Kitchen sink",
    category: "plumbing",
    room: "Kitchen",
    icon: "🚰",
    blurb: "Leak, clog, or slow drain under the sink",
  },
  {
    id: "bedroom-ac",
    name: "Bedroom AC",
    category: "ac",
    room: "Bedroom",
    icon: "❄️",
    blurb: "Cooling, airflow, or noise from the split AC",
  },
  {
    id: "bathroom-geyser",
    name: "Bathroom geyser",
    category: "geyser",
    room: "Bathroom",
    icon: "🔥",
    blurb: "No hot water, leaks, or overheating",
  },
  {
    id: "wall-socket",
    name: "Wall socket",
    category: "electrical",
    room: "Living / bedroom",
    icon: "🔌",
    blurb: "Sparks, buzzing, burning smell, or no power",
  },
  {
    id: "water-pump",
    name: "Water motor / pump",
    category: "water_pump",
    room: "Utility",
    icon: "⚙️",
    blurb: "Motor not starting, low pressure, or unusual noise",
  },
];

const SINK_MCQS: Mcq[] = [
  {
    id: "sink-when",
    question: "When do you notice water under the sink?",
    options: [
      { id: "only-running", label: "Only when the tap is running", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "always", label: "Even when the tap is off", score: { TECHNICIAN: 2 } },
      { id: "after-use", label: "After washing dishes / a lot of water", score: { DIY: 1 } },
    ],
  },
  {
    id: "sink-source",
    question: "Can you see where the water is coming from?",
    options: [
      { id: "ptrap", label: "The U-shaped pipe (P-trap)", score: { TECHNICIAN: 2 } },
      { id: "loose", label: "A loose connection I can see", score: { DIY: 2 } },
      { id: "unclear", label: "I can't tell", score: { TECHNICIAN: 2 } },
    ],
  },
  {
    id: "sink-safety",
    question: "Is water near any electrical sockets or wiring?",
    options: [
      { id: "no", label: "No — dry around electrics", score: { DIY: 1 } },
      { id: "near", label: "Yes — water is near a socket or wire", score: { EMERGENCY: 3 } },
      { id: "unsure", label: "Not sure", score: { TECHNICIAN: 1 } },
    ],
  },
];

const AC_MCQS: Mcq[] = [
  {
    id: "ac-symptom",
    question: "What is the main AC problem?",
    options: [
      { id: "weak", label: "Weak airflow / not cooling well", score: { DIY: 2 } },
      { id: "none", label: "No cool air at all", score: { TECHNICIAN: 2 } },
      { id: "noise", label: "Loud noise or vibration", score: { TECHNICIAN: 2 } },
    ],
  },
  {
    id: "ac-filter",
    question: "Does the filter look dirty or blocked?",
    options: [
      { id: "dirty", label: "Yes — dusty / dirty", score: { DIY: 2 } },
      { id: "clean", label: "Looks clean", score: { TECHNICIAN: 2 } },
      { id: "cant", label: "I haven't checked", score: { DIY: 1 } },
    ],
  },
  {
    id: "ac-safety",
    question: "Any burning smell, sparks, or smoke from the unit?",
    options: [
      { id: "no", label: "No electrical warning signs", score: { DIY: 1 } },
      { id: "yes", label: "Yes — smell, sparks, or smoke", score: { EMERGENCY: 3 } },
      { id: "warm", label: "Only unusual warmth", score: { TECHNICIAN: 1 } },
    ],
  },
];

const GEYSER_MCQS: Mcq[] = [
  {
    id: "geyser-main",
    question: "What is happening with the geyser?",
    options: [
      { id: "no-hot", label: "No hot water", score: { TECHNICIAN: 2 } },
      { id: "leak", label: "Water leaking from the unit", score: { TECHNICIAN: 2 } },
      { id: "pilot", label: "Pilot / ignition issue (gas)", score: { TECHNICIAN: 1 } },
    ],
  },
  {
    id: "geyser-safety",
    question: "Do you smell gas or see scorch marks?",
    options: [
      { id: "no", label: "No gas smell or burn marks", score: { TECHNICIAN: 1 } },
      { id: "gas", label: "Gas smell", score: { EMERGENCY: 3 } },
      { id: "scorch", label: "Scorch marks / overheating", score: { EMERGENCY: 3 } },
    ],
  },
  {
    id: "geyser-power",
    question: "Is the geyser getting power / gas as usual?",
    options: [
      { id: "yes", label: "Yes — supply seems normal", score: { TECHNICIAN: 1 } },
      { id: "trip", label: "Breaker trips when I turn it on", score: { EMERGENCY: 2, TECHNICIAN: 1 } },
      { id: "unsure", label: "Not sure", score: { TECHNICIAN: 1 } },
    ],
  },
];

const SOCKET_MCQS: Mcq[] = [
  {
    id: "socket-sign",
    question: "What are you noticing at the socket?",
    options: [
      { id: "dead", label: "No power / dead socket", score: { TECHNICIAN: 2 } },
      { id: "buzz", label: "Buzzing or humming", score: { EMERGENCY: 2 } },
      { id: "spark", label: "Sparks when plugging in", score: { EMERGENCY: 3 } },
    ],
  },
  {
    id: "socket-smell",
    question: "Is there a burning smell or discoloration?",
    options: [
      { id: "no", label: "No smell or marks", score: { TECHNICIAN: 1 } },
      { id: "burn", label: "Burning smell", score: { EMERGENCY: 3 } },
      { id: "brown", label: "Brown / black marks on the outlet", score: { EMERGENCY: 3 } },
    ],
  },
  {
    id: "socket-use",
    question: "Is the socket still being used?",
    options: [
      { id: "stopped", label: "I stopped using it", score: { TECHNICIAN: 1 } },
      { id: "still", label: "Still plugged in / in use", score: { EMERGENCY: 2 } },
      { id: "kids", label: "Kids or others might touch it", score: { EMERGENCY: 2 } },
    ],
  },
];

const PUMP_MCQS: Mcq[] = [
  {
    id: "pump-symptom",
    question: "What is the pump doing?",
    options: [
      { id: "silent", label: "Won't start / silent", score: { TECHNICIAN: 2 } },
      { id: "hum", label: "Hums but doesn't pump", score: { TECHNICIAN: 2 } },
      { id: "weak", label: "Runs but weak water pressure", score: { DIY: 1, TECHNICIAN: 1 } },
    ],
  },
  {
    id: "pump-safety",
    question: "Any burning smell from the motor or wet electrics?",
    options: [
      { id: "no", label: "No smell; motor area is dry", score: { TECHNICIAN: 1 } },
      { id: "burn", label: "Burning smell from the motor", score: { EMERGENCY: 3 } },
      { id: "wet", label: "Water on wiring / wet motor", score: { EMERGENCY: 3 } },
    ],
  },
  {
    id: "pump-valve",
    question: "Are inlet/outlet valves open and the tank not empty?",
    options: [
      { id: "ok", label: "Valves open, water available", score: { TECHNICIAN: 2 } },
      { id: "closed", label: "A valve might be closed", score: { DIY: 2 } },
      { id: "unsure", label: "Not sure", score: { TECHNICIAN: 1 } },
    ],
  },
];

const GENERIC_MCQS: Mcq[] = [
  {
    id: "gen-urgency",
    question: "How urgent does this feel?",
    options: [
      { id: "annoy", label: "Annoying but manageable", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "worse", label: "Getting worse quickly", score: { TECHNICIAN: 2 } },
      { id: "danger", label: "Feels unsafe right now", score: { EMERGENCY: 3 } },
    ],
  },
  {
    id: "gen-safety",
    question: "Any gas smell, smoke, sparks, or water near electricity?",
    options: [
      { id: "no", label: "None of those", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "yes", label: "Yes — one or more of those", score: { EMERGENCY: 3 } },
      { id: "maybe", label: "Possibly", score: { TECHNICIAN: 1, EMERGENCY: 1 } },
    ],
  },
  {
    id: "gen-skill",
    question: "Are you comfortable trying a simple check yourself?",
    options: [
      { id: "yes", label: "Yes — if it's safe and simple", score: { DIY: 2 } },
      { id: "no", label: "I'd rather get a technician", score: { TECHNICIAN: 2 } },
      { id: "unsure", label: "Not sure yet", score: { TECHNICIAN: 1 } },
    ],
  },
];

export const APPLIANCE_MCQS: Record<string, Mcq[]> = {
  "kitchen-sink": SINK_MCQS,
  "bedroom-ac": AC_MCQS,
  "bathroom-geyser": GEYSER_MCQS,
  "wall-socket": SOCKET_MCQS,
  "water-pump": PUMP_MCQS,
  custom: GENERIC_MCQS,
};

export const APPLIANCE_DIY: Record<string, DiyGuideStep[]> = {
  "kitchen-sink": [
    {
      order: 1,
      instruction: "Place a bucket under the sink and dry the area so you can see fresh drips.",
      success_check: "You can see where new water appears.",
    },
    {
      order: 2,
      instruction: "Hand-tighten any visibly loose slip nuts on the drain connections — no tools yet.",
      success_check: "Nuts feel snug and dripping slows or stops when water runs.",
    },
    {
      order: 3,
      instruction: "Run the tap briefly and watch for leaks. If drip continues from the P-trap, stop and escalate.",
      success_check: "No drip after 30 seconds of running water.",
    },
  ],
  "bedroom-ac": [
    {
      order: 1,
      instruction: "Turn the AC off at the remote and wall switch. Open the front panel.",
      success_check: "Filter is visible and reachable without force.",
    },
    {
      order: 2,
      instruction: "Slide the filter out and gently vacuum or rinse dust. Let it dry fully if washed.",
      success_check: "Filter looks cleaner and is dry before reinstall.",
    },
    {
      order: 3,
      instruction: "Reinstall the filter, close the panel, turn AC on, wait 5 minutes, check airflow.",
      success_check: "Airflow feels stronger and there is no burning smell.",
    },
  ],
  "water-pump": [
    {
      order: 1,
      instruction: "Confirm the power switch is on and the breaker has not tripped.",
      success_check: "Power appears available to the motor.",
    },
    {
      order: 2,
      instruction: "Check that inlet and outlet valves are fully open and the overhead/tank has water.",
      success_check: "Valves open and water supply is present.",
    },
    {
      order: 3,
      instruction: "Try starting the pump once. If it only hums or smells hot, switch off immediately.",
      success_check: "Pump starts and pressure improves without burning smell.",
    },
  ],
  custom: [
    {
      order: 1,
      instruction: "Write down what you observe (sounds, smells, leaks) and isolate power/water if safe.",
      success_check: "The area is stable and you are not forcing anything unsafe.",
    },
    {
      order: 2,
      instruction: "Try only the simplest reversible check for this appliance (reset, clear vent, tighten a visible fitting).",
      success_check: "The symptom improves without new warning signs.",
    },
  ],
};

export function scoreOutcome(
  answers: Array<{ optionId: string; scores: Partial<Record<FlowOutcome, number>> }>
): { outcome: FlowOutcome; totals: Record<FlowOutcome, number> } {
  const totals: Record<FlowOutcome, number> = {
    DIY: 0,
    TECHNICIAN: 0,
    EMERGENCY: 0,
  };
  for (const a of answers) {
    for (const [k, v] of Object.entries(a.scores) as Array<[FlowOutcome, number]>) {
      totals[k] += v ?? 0;
    }
  }
  if (totals.EMERGENCY >= 3) {
    return { outcome: "EMERGENCY", totals };
  }
  if (totals.DIY >= totals.TECHNICIAN && totals.DIY > 0) {
    return { outcome: "DIY", totals };
  }
  return { outcome: "TECHNICIAN", totals };
}

export function buildProblemSummary(input: {
  applianceName: string;
  room: string;
  notes: string;
  answers: Array<{ question: string; answer: string }>;
}) {
  const lines = [
    `${input.applianceName} (${input.room})`,
    input.notes.trim() || "User reported a home problem.",
    ...input.answers.map((a) => `${a.question} → ${a.answer}`),
  ];
  return lines.join(". ");
}
