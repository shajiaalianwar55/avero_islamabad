export type FlowOutcome = "DIY" | "TECHNICIAN" | "EMERGENCY";

export type ApplianceDef = {
  id: string;
  name: string;
  brand: string;
  yearBought: number;
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

/** Demo home inventory — brands common in Pakistan. Radiator is the primary demo path. */
export const DEMO_APPLIANCES: ApplianceDef[] = [
  {
    id: "radiator",
    name: "Oil-filled room radiator",
    brand: "Delonghi",
    yearBought: 2022,
    category: "plumbing",
    room: "Living room",
    icon: "🌡️",
    blurb: "No heat, weak heat, leak, or unsafe smells — winter heater demo",
  },
  {
    id: "kitchen-sink",
    name: "Kitchen sink & faucet",
    brand: "Master",
    yearBought: 2021,
    category: "plumbing",
    room: "Kitchen",
    icon: "🚰",
    blurb: "Leak, clog, or slow drain under the sink",
  },
  {
    id: "bedroom-ac",
    name: "1.5 Ton inverter split AC",
    brand: "Gree",
    yearBought: 2023,
    category: "ac",
    room: "Bedroom",
    icon: "❄️",
    blurb: "Cooling, airflow, or noise from the split AC",
  },
  {
    id: "bathroom-geyser",
    name: "Electric storage geyser",
    brand: "NasGas",
    yearBought: 2020,
    category: "geyser",
    room: "Bathroom",
    icon: "🔥",
    blurb: "No hot water, leaks, or overheating",
  },
  {
    id: "wall-socket",
    name: "Wall socket / switchboard",
    brand: "Schneider",
    yearBought: 2019,
    category: "electrical",
    room: "Living room",
    icon: "🔌",
    blurb: "Sparks, buzzing, burning smell, or no power",
  },
  {
    id: "water-pump",
    name: "Water motor / booster pump",
    brand: "Super Asia",
    yearBought: 2022,
    category: "water_pump",
    room: "Utility",
    icon: "⚙️",
    blurb: "Motor not starting, low pressure, or unusual noise",
  },
  {
    id: "fridge",
    name: "Refrigerator",
    brand: "Dawlance",
    yearBought: 2021,
    category: "appliance",
    room: "Kitchen",
    icon: "🧊",
    blurb: "Not cooling, unusual noise, or water leak",
  },
  {
    id: "washer",
    name: "Front-load washing machine",
    brand: "Haier",
    yearBought: 2024,
    category: "appliance",
    room: "Laundry",
    icon: "🧺",
    blurb: "Won't spin, drains poorly, or error codes",
  },
  {
    id: "ups",
    name: "UPS / inverter",
    brand: "PEL",
    yearBought: 2022,
    category: "ups_inverter",
    room: "Living room",
    icon: "🔋",
    blurb: "No backup, beeping, or battery issues",
  },
];

export function applianceLabel(a: Pick<ApplianceDef, "brand" | "name" | "yearBought">) {
  return `${a.brand} ${a.name} (${a.yearBought})`;
}

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

const FRIDGE_MCQS: Mcq[] = [
  {
    id: "fridge-symptom",
    question: "What is wrong with the fridge?",
    options: [
      { id: "warm", label: "Not cooling / food getting warm", score: { TECHNICIAN: 2 } },
      { id: "noise", label: "Loud or strange noise", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "leak", label: "Water pooling underneath", score: { DIY: 1, TECHNICIAN: 1 } },
    ],
  },
  {
    id: "fridge-power",
    question: "Is the fridge getting power (light on when door opens)?",
    options: [
      { id: "yes", label: "Yes — light works", score: { TECHNICIAN: 1 } },
      { id: "no", label: "No power / dead", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "trip", label: "Breaker trips when it runs", score: { EMERGENCY: 2, TECHNICIAN: 1 } },
    ],
  },
  {
    id: "fridge-safety",
    question: "Any burning smell from the compressor or wiring?",
    options: [
      { id: "no", label: "No burning smell", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "yes", label: "Yes — burning smell", score: { EMERGENCY: 3 } },
      { id: "unsure", label: "Not sure", score: { TECHNICIAN: 1 } },
    ],
  },
];

const WASHER_MCQS: Mcq[] = [
  {
    id: "washer-symptom",
    question: "What is the washing machine doing?",
    options: [
      { id: "spin", label: "Won't spin / clothes stay wet", score: { TECHNICIAN: 2 } },
      { id: "drain", label: "Won't drain", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "error", label: "Shows an error code", score: { TECHNICIAN: 2 } },
    ],
  },
  {
    id: "washer-load",
    question: "Is the load balanced and the filter/lint trap clear?",
    options: [
      { id: "ok", label: "Load looks fine; filter checked", score: { TECHNICIAN: 2 } },
      { id: "heavy", label: "Might be overloaded / unbalanced", score: { DIY: 2 } },
      { id: "unsure", label: "Haven't checked", score: { DIY: 1 } },
    ],
  },
  {
    id: "washer-safety",
    question: "Any water near the power cord or burning smell?",
    options: [
      { id: "no", label: "Dry and no smell", score: { DIY: 1 } },
      { id: "wet", label: "Water near the plug / cord", score: { EMERGENCY: 3 } },
      { id: "burn", label: "Burning smell", score: { EMERGENCY: 3 } },
    ],
  },
];

const UPS_MCQS: Mcq[] = [
  {
    id: "ups-symptom",
    question: "What is the UPS / inverter doing?",
    options: [
      { id: "nobackup", label: "No backup when lights go out", score: { TECHNICIAN: 2 } },
      { id: "beep", label: "Constant beeping / alarm", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "dead", label: "Completely dead / won't switch on", score: { TECHNICIAN: 2 } },
    ],
  },
  {
    id: "ups-battery",
    question: "How old is the battery, roughly?",
    options: [
      { id: "new", label: "Under 2 years", score: { TECHNICIAN: 1 } },
      { id: "old", label: "Over 2–3 years (often needs replace)", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "unsure", label: "Not sure", score: { TECHNICIAN: 1 } },
    ],
  },
  {
    id: "ups-safety",
    question: "Any burning smell, swollen battery, or smoke?",
    options: [
      { id: "no", label: "No — looks normal", score: { DIY: 1, TECHNICIAN: 1 } },
      { id: "yes", label: "Yes — smell, swelling, or smoke", score: { EMERGENCY: 3 } },
      { id: "hot", label: "Unusually hot to touch", score: { EMERGENCY: 2, TECHNICIAN: 1 } },
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
  fridge: FRIDGE_MCQS,
  washer: WASHER_MCQS,
  ups: UPS_MCQS,
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
  fridge: [
    {
      order: 1,
      instruction: "Confirm the fridge is plugged in firmly and the wall socket works with another device.",
      success_check: "Power is reaching the fridge (interior light or display on).",
    },
    {
      order: 2,
      instruction: "Check that the thermostat is not set to off / minimum, and give it 30 minutes after any change.",
      success_check: "Settings look correct; compressor may start humming.",
    },
    {
      order: 3,
      instruction: "Clear dust from the rear / bottom vents if safely reachable. Do not force panels.",
      success_check: "Vents are clearer and there is no burning smell.",
    },
  ],
  washer: [
    {
      order: 1,
      instruction: "Redistribute the load so clothes are even, and close the door firmly.",
      success_check: "Door locks and cycle can start without immediate error.",
    },
    {
      order: 2,
      instruction: "Check and clean the drain filter / coin trap if your Haier model has one (bucket ready).",
      success_check: "Filter is clear of lint and small objects.",
    },
    {
      order: 3,
      instruction: "Run a short rinse/spin. If it still won't drain or smells burnt, stop and escalate.",
      success_check: "Water drains and spin completes without burning smell.",
    },
  ],
  ups: [
    {
      order: 1,
      instruction: "Confirm wall power to the UPS, then check battery terminals are tight (power off first if you open the case).",
      success_check: "UPS powers on without smoke or strong burning smell.",
    },
    {
      order: 2,
      instruction: "Note the beeping pattern from the manual if possible; reset once using the front button.",
      success_check: "Alarm stops or changes to a normal status light.",
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
  brand?: string;
  yearBought?: number;
  room: string;
  notes: string;
  answers: Array<{ question: string; answer: string }>;
}) {
  const identity = [input.brand, input.applianceName, input.yearBought ? `bought ${input.yearBought}` : null]
    .filter(Boolean)
    .join(" ");
  const lines = [
    `${identity} (${input.room})`,
    input.notes.trim() || "User reported a home problem.",
    ...input.answers.map((a) => `${a.question} → ${a.answer}`),
  ];
  return lines.join(". ");
}
