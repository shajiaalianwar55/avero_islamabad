import type { DiagnosticKnowledgeBase, Hypothesis, DiagnosticQuestion } from "../../types";

const H = {
  supply_loose: "sink_supply_line_loose",
  trap_loose: "sink_ptrap_loose",
  trap_clog: "sink_ptrap_clog",
  drain_clog_deeper: "sink_deeper_drain_clog",
  basket_seal: "sink_basket_strainer_seal",
  faucet_base: "sink_faucet_base_leak",
  dishwasher_line: "sink_dishwasher_connection",
  condensation: "sink_condensation_only",
  cabinet_elsewhere: "sink_leak_from_elsewhere",
  slow_vent: "sink_vent_or_slow_drain",
  disposal_issue: "sink_disposal_issue",
  water_near_elec: "sink_water_near_electrical",
  active_burst: "sink_active_burst_or_flood",
} as const;

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

const unsure = (effects: Array<[string, number]> = []) =>
  opt("unsure", "I'm not sure", effects);

const hypotheses: Hypothesis[] = [
  {
    id: H.supply_loose,
    label: "Loose flexible supply line",
    summary: "A connection on the hot/cold hose under the sink may be loose and dripping when water runs.",
    prior: 1.1,
    path: "DIY",
    diySteps: [
      {
        instruction: "Put a dry towel and bucket under the sink. Look at the flexible hoses to the faucet.",
        success_check: "You can see which joint shows fresh water when the tap runs.",
      },
      {
        instruction: "Hand-tighten the wet joint gently (no big tools). Do not force metal nuts hard.",
        success_check: "Dripping slows or stops when you run the tap briefly.",
      },
    ],
  },
  {
    id: H.trap_loose,
    label: "Loose drain / P-trap joint",
    summary: "The U-shaped drain pipes under the sink may have a loose slip nut.",
    prior: 1.2,
    path: "DIY",
    diySteps: [
      {
        instruction: "Dry the pipes, then hand-tighten the large plastic slip nuts on the U-bend.",
        success_check: "Nuts feel snug and a short tap run does not drip from that joint.",
      },
    ],
  },
  {
    id: H.trap_clog,
    label: "Clog in the P-trap",
    summary: "Food/grease in the U-bend can cause slow draining or small leaks at joints under pressure.",
    prior: 1.0,
    path: "DIY",
    diySteps: [
      {
        instruction: "Place a bucket, unscrew the trap slip nuts by hand, empty debris into the bucket.",
        success_check: "Water drains faster and the trap is clear of thick gunk.",
      },
    ],
  },
  {
    id: H.drain_clog_deeper,
    label: "Deeper drain blockage",
    summary: "A clog further into the wall/floor drain usually needs a plumber.",
    prior: 0.9,
    path: "TECHNICIAN",
  },
  {
    id: H.basket_seal,
    label: "Sink strainer / basket seal leak",
    summary: "The seal where the metal strainer sits in the sink bowl can drip into the cabinet.",
    prior: 0.95,
    path: "TECHNICIAN",
  },
  {
    id: H.faucet_base,
    label: "Faucet base leak",
    summary: "Water may be seeping under the faucet where it meets the sink deck.",
    prior: 0.9,
    path: "TECHNICIAN",
  },
  {
    id: H.dishwasher_line,
    label: "Dishwasher drain / supply under sink",
    summary: "A dishwasher hose tied into the sink plumbing can be the real leak source.",
    prior: 0.75,
    path: "TECHNICIAN",
  },
  {
    id: H.condensation,
    label: "Condensation only (not a leak)",
    summary: "Cold pipes can sweat and look like a leak without a true joint failure.",
    prior: 0.7,
    path: "DIY",
    diySteps: [
      {
        instruction: "Dry everything, then check again without running cold water for a few minutes.",
        success_check: "No fresh dripping from a joint — only light moisture on cold pipe surfaces.",
      },
    ],
  },
  {
    id: H.cabinet_elsewhere,
    label: "Water from elsewhere in the cabinet",
    summary: "Water under the sink may come from a fridge line, wall seep, or something stored that spilled.",
    prior: 0.7,
    path: "TECHNICIAN",
  },
  {
    id: H.slow_vent,
    label: "Slow drain / venting issue",
    summary: "Gurgling and very slow draining can be venting or a partial clog — often needs a plumber if trap cleaning fails.",
    prior: 0.8,
    path: "TECHNICIAN",
  },
  {
    id: H.disposal_issue,
    label: "Garbage disposal leak or jam",
    summary: "If you have a disposal, its body or reset area can leak or cause backup.",
    prior: 0.7,
    path: "TECHNICIAN",
  },
  {
    id: H.water_near_elec,
    label: "Water near electrics under sink",
    summary: "Water reaching an under-sink socket, disposal wiring, or dishwasher plug is unsafe.",
    prior: 0.5,
    path: "TECHNICIAN",
  },
  {
    id: H.active_burst,
    label: "Active spray / flooding",
    summary: "A spraying hose or rapidly rising water needs the shutoff used and urgent help.",
    prior: 0.4,
    path: "TECHNICIAN",
  },
];

const questions: DiagnosticQuestion[] = [
  {
    id: "sink_safety_flood",
    prompt: "Is water spraying, or is the cabinet filling quickly?",
    priority: 1,
    options: [
      opt(
        "spraying",
        "Yes — spraying or rising fast",
        [
          [H.active_burst, 3],
          [H.supply_loose, 1],
          [H.water_near_elec, 1],
        ],
        {
          emergency: true,
          reason: "Active spray/flood under the sink — shut the under-sink or main water valve if you can, keep clear of electrics.",
        }
      ),
      opt("not_flood", "No — it's a drip or small puddle", [
        [H.active_burst, -2],
        [H.trap_loose, 0.4],
        [H.supply_loose, 0.4],
      ]),
      unsure([[H.active_burst, 0.2]]),
    ],
  },
  {
    id: "sink_water_electrics",
    prompt: "Is the water near any plug, switch, disposal wiring, or dishwasher cord?",
    priority: 1,
    options: [
      opt(
        "near_elec",
        "Yes — water is near electrics",
        [
          [H.water_near_elec, 3],
          [H.active_burst, 0.5],
        ],
        {
          emergency: true,
          reason: "Water near under-sink electrics — avoid the area and treat as emergency.",
        }
      ),
      opt("dry_elec", "No — area around electrics looks dry", [
        [H.water_near_elec, -2],
      ]),
      unsure([[H.water_near_elec, 0.3]]),
    ],
  },
  {
    id: "sink_when",
    prompt: "When do you notice water under the sink?",
    priority: 1,
    options: [
      opt("only_running", "Only when the tap is running", [
        [H.supply_loose, 2],
        [H.faucet_base, 1.2],
        [H.trap_loose, 0.6],
        [H.condensation, -0.5],
        [H.cabinet_elsewhere, -0.5],
      ]),
      opt("after_use", "After washing dishes / lots of water down the drain", [
        [H.trap_loose, 1.5],
        [H.trap_clog, 1.2],
        [H.basket_seal, 1],
        [H.drain_clog_deeper, 0.6],
        [H.disposal_issue, 0.6],
      ]),
      opt("always", "Even when nothing has been used for a while", [
        [H.supply_loose, 1.2],
        [H.cabinet_elsewhere, 1.2],
        [H.dishwasher_line, 0.8],
        [H.condensation, 0.5],
        [H.faucet_base, 0.5],
      ]),
      opt("no_leak_slow", "No puddle — mainly slow draining / gurgling", [
        [H.trap_clog, 1.5],
        [H.drain_clog_deeper, 1.5],
        [H.slow_vent, 1.5],
        [H.supply_loose, -1.5],
        [H.faucet_base, -1],
      ]),
      unsure(),
    ],
  },
  {
    id: "sink_where_seen",
    prompt: "If you look under the sink with a torch, where does fresh water appear?",
    priority: 2,
    options: [
      opt("on_hoses", "On the flexible hot/cold hoses to the tap", [
        [H.supply_loose, 3],
        [H.trap_loose, -1],
        [H.trap_clog, -1],
        [H.condensation, -0.5],
      ]),
      opt("on_ubend", "On the U-shaped drain pipes", [
        [H.trap_loose, 2.5],
        [H.trap_clog, 1],
        [H.supply_loose, -1.5],
      ]),
      opt("at_bowl", "Around the metal strainer where the sink bowl meets the drain", [
        [H.basket_seal, 3],
        [H.trap_loose, 0.4],
        [H.supply_loose, -1],
      ]),
      opt("at_tap_deck", "Around the base of the tap on top of the sink", [
        [H.faucet_base, 3],
        [H.supply_loose, 0.5],
      ]),
      opt("floor_unclear", "Only on the cabinet floor — can't see the source", [
        [H.cabinet_elsewhere, 1.5],
        [H.dishwasher_line, 1],
        [H.condensation, 0.6],
        [H.supply_loose, 0.4],
      ]),
      unsure([[H.cabinet_elsewhere, 0.4]]),
    ],
  },
  {
    id: "sink_drain_speed",
    prompt: "How does the sink drain?",
    priority: 2,
    options: [
      opt("drains_fine", "Drains normally", [
        [H.trap_clog, -2],
        [H.drain_clog_deeper, -2],
        [H.slow_vent, -1.5],
        [H.supply_loose, 0.5],
        [H.faucet_base, 0.4],
      ]),
      opt("drains_slow", "Slow", [
        [H.trap_clog, 2],
        [H.drain_clog_deeper, 1.2],
        [H.slow_vent, 1],
        [H.disposal_issue, 0.5],
      ]),
      opt("drains_backup", "Backs up / almost blocked", [
        [H.drain_clog_deeper, 2.5],
        [H.trap_clog, 1.5],
        [H.slow_vent, 1],
        [H.supply_loose, -1],
      ]),
      unsure([[H.trap_clog, 0.3]]),
    ],
  },
  {
    id: "sink_gurgle",
    prompt: "Do you hear gurgling from the drain or nearby pipes?",
    priority: 3,
    conditions: {
      anyActiveHypothesis: [H.slow_vent, H.drain_clog_deeper, H.trap_clog],
    },
    options: [
      opt("gurgle_yes", "Yes — gurgling", [
        [H.slow_vent, 2.5],
        [H.drain_clog_deeper, 1.2],
        [H.trap_clog, 0.6],
      ]),
      opt("gurgle_no", "No", [
        [H.slow_vent, -2],
      ]),
      unsure([[H.slow_vent, 0.3]]),
    ],
  },
  {
    id: "sink_dry_test",
    prompt: "If you dry the area completely, where does the first new wet spot appear when you run the tap?",
    priority: 3,
    conditions: {
      minAsked: 2,
      anyActiveHypothesis: [
        H.supply_loose,
        H.trap_loose,
        H.basket_seal,
        H.faucet_base,
        H.condensation,
      ],
    },
    options: [
      opt("first_hose", "Hose / supply joint", [[H.supply_loose, 2.5], [H.condensation, -1.5]]),
      opt("first_trap", "U-bend joint", [[H.trap_loose, 2.5], [H.condensation, -1.5]]),
      opt("first_strainer", "Under the strainer", [[H.basket_seal, 2.5]]),
      opt("first_mist", "Just a general dampness on cold pipes", [
        [H.condensation, 3],
        [H.supply_loose, -1],
        [H.trap_loose, -1],
      ]),
      opt("first_none", "Nothing new appeared", [
        [H.cabinet_elsewhere, 1.5],
        [H.dishwasher_line, 1],
        [H.condensation, 0.5],
      ]),
      unsure(),
    ],
  },
  {
    id: "sink_dishwasher",
    prompt: "Do you have a dishwasher connected under this sink?",
    priority: 4,
    conditions: {
      anyActiveHypothesis: [H.dishwasher_line, H.cabinet_elsewhere, H.trap_loose],
    },
    options: [
      opt("dw_yes_wet", "Yes — and that area looks wet", [
        [H.dishwasher_line, 3],
        [H.cabinet_elsewhere, 0.5],
      ]),
      opt("dw_yes_dry", "Yes — but that hose area looks dry", [
        [H.dishwasher_line, -2],
      ]),
      opt("dw_no", "No dishwasher", [
        [H.dishwasher_line, -3],
      ]),
      unsure([[H.dishwasher_line, 0.3]]),
    ],
  },
  {
    id: "sink_disposal",
    prompt: "Is there a garbage disposal (food grinder) under the sink?",
    priority: 4,
    conditions: {
      anyActiveHypothesis: [H.disposal_issue, H.trap_loose, H.trap_clog],
    },
    options: [
      opt("disp_yes_leak", "Yes — and it looks wet around the disposal body", [
        [H.disposal_issue, 3],
        [H.trap_loose, 0.4],
      ]),
      opt("disp_yes_ok", "Yes — but it looks dry", [[H.disposal_issue, -2]]),
      opt("disp_no", "No disposal", [[H.disposal_issue, -3]]),
      unsure([[H.disposal_issue, 0.3]]),
    ],
  },
  {
    id: "sink_both_bowls",
    prompt: "If it is a double sink, is only one side slow or leaking?",
    priority: 5,
    conditions: {
      anyActiveHypothesis: [H.trap_clog, H.basket_seal, H.drain_clog_deeper],
    },
    options: [
      opt("one_side", "Only one side", [
        [H.basket_seal, 1.2],
        [H.trap_clog, 1],
        [H.drain_clog_deeper, -0.5],
      ]),
      opt("both_sides", "Both sides", [
        [H.drain_clog_deeper, 1.5],
        [H.slow_vent, 1],
        [H.trap_clog, 0.6],
      ]),
      opt("single_bowl", "Single bowl sink", []),
      unsure(),
    ],
  },
  {
    id: "sink_hand_tighten_ok",
    prompt: "Can you clearly see a dripping joint that you could gently hand-tighten?",
    priority: 5,
    conditions: {
      anyActiveHypothesis: [H.supply_loose, H.trap_loose, H.faucet_base, H.drain_clog_deeper],
      minAsked: 3,
    },
    options: [
      opt("can_tighten", "Yes — an obvious loose-looking joint", [
        [H.supply_loose, 1],
        [H.trap_loose, 1],
        [H.drain_clog_deeper, -1],
        [H.cabinet_elsewhere, -0.5],
      ]),
      opt("cannot_see", "No — source is hidden or needs tools", [
        [H.drain_clog_deeper, 0.8],
        [H.faucet_base, 0.6],
        [H.basket_seal, 0.6],
        [H.cabinet_elsewhere, 0.5],
      ]),
      unsure(),
    ],
  },
  {
    id: "sink_shutoff_known",
    prompt: "Do you know where the under-sink or home water shutoff is, if things get worse?",
    priority: 8,
    conditions: { minAsked: 2 },
    options: [
      opt("shutoff_yes", "Yes", []),
      opt("shutoff_no", "No", [], {
        caution: true,
        reason: "Locate your water shutoff before trying DIY under the sink.",
      }),
      unsure(),
    ],
  },
];

export const kitchenSinkKb: DiagnosticKnowledgeBase = {
  id: "plumbing.kitchen_sink",
  domain: "plumbing",
  title: "Kitchen sink",
  description: "Leak, drip, and drain diagnostics — observable under-sink checks only.",
  hypotheses,
  questions,
  config: {
    maxQuestions: 10,
    confidenceMargin: 2.3,
    minLeaderScore: 4.5,
    minUtility: 0.3,
    topK: 4,
    minQuestionsForConfidence: 4,
  },
};
