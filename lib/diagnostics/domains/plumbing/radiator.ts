import type { DiagnosticKnowledgeBase, Hypothesis, DiagnosticQuestion } from "../../types";

/**
 * Oil-filled / panel room radiator (common winter heater in Islamabad homes)
 * + hydronic wall radiator paths.
 * Exhaustive homeowner-observable questions — demo-quality tree.
 */

const H = {
  unplugged: "rad_unplugged_or_switch_off",
  dead_socket: "rad_dead_socket_or_breaker",
  tip_over: "rad_tip_over_safety",
  thermostat_low: "rad_thermostat_too_low",
  timer_off: "rad_timer_or_mode_off",
  still_warming: "rad_still_warming_up",
  dusty_blocked: "rad_dust_blocking_heat",
  undersized: "rad_undersized_for_room",
  element_fail: "rad_heating_element_failed",
  thermostat_fail: "rad_thermostat_failed",
  cord_fault: "rad_cord_or_plug_fault",
  oil_leak: "rad_oil_leak",
  overheat_cutout: "rad_thermal_cutout",
  hydronic_valve: "rad_hydronic_valve_closed",
  hydronic_air: "rad_hydronic_airlock",
  hydronic_boiler: "rad_boiler_or_source_off",
  hydronic_leak: "rad_hydronic_pipe_leak",
  electrical_hazard: "rad_electrical_hazard",
  fire_risk: "rad_fire_or_smoke_risk",
} as const;

const hypotheses: Hypothesis[] = [
  {
    id: H.unplugged,
    label: "Not plugged in or power switch off",
    summary: "The radiator may simply be unplugged or its power switch is off.",
    prior: 1.2,
    path: "DIY",
    diySteps: [
      {
        instruction: "Check the wall plug is fully in and the radiator's power switch is ON.",
        success_check: "A power or standby light appears, or you feel faint warmth after a few minutes.",
      },
      {
        instruction: "Try a different known-working wall socket if the first one seems dead.",
        success_check: "The unit shows power on the new socket.",
      },
    ],
  },
  {
    id: H.dead_socket,
    label: "Dead socket or tripped breaker",
    summary: "The wall socket or home breaker may not be supplying power.",
    prior: 1.1,
    path: "DIY",
    diySteps: [
      {
        instruction: "Test the same socket with a phone charger or lamp.",
        success_check: "You know whether the socket itself works.",
      },
      {
        instruction: "If the socket is dead, check the breaker/DB for a tripped switch and reset once.",
        success_check: "Socket works again, or you confirm it stays dead (then call an electrician).",
      },
    ],
  },
  {
    id: H.tip_over,
    label: "Tip-over / tilt safety lock",
    summary: "Many radiators cut power if tilted — sitting unevenly can keep it off.",
    prior: 1.0,
    path: "DIY",
    diySteps: [
      {
        instruction: "Place the radiator upright on a flat floor and wait 30 seconds.",
        success_check: "Power returns or heating starts after it sits level.",
      },
    ],
  },
  {
    id: H.thermostat_low,
    label: "Thermostat set too low",
    summary: "The dial/temperature setting may be below room temperature, so it never heats.",
    prior: 1.3,
    path: "DIY",
    diySteps: [
      {
        instruction: "Turn the thermostat dial to maximum / highest number for a test.",
        success_check: "You feel heat along the panels within 10–15 minutes.",
      },
      {
        instruction: "Then set it to a comfortable mid level once it is working.",
        success_check: "It cycles on and off instead of staying stone cold.",
      },
    ],
  },
  {
    id: H.timer_off,
    label: "Timer or eco mode keeping it off",
    summary: "A timer, eco, or frost-only mode may be preventing normal heating.",
    prior: 0.9,
    path: "DIY",
    diySteps: [
      {
        instruction: "Switch mode to continuous / manual heat (disable timer for now).",
        success_check: "The heater runs without waiting for a programmed slot.",
      },
    ],
  },
  {
    id: H.still_warming,
    label: "Still warming up (normal delay)",
    summary: "Oil-filled radiators often take 10–20 minutes before panels feel hot.",
    prior: 1.0,
    path: "DIY",
    diySteps: [
      {
        instruction: "Leave it on high for a full 15 minutes without unplugging.",
        success_check: "Panels become warm/hot to a careful brief touch on the outer metal.",
      },
    ],
  },
  {
    id: H.dusty_blocked,
    label: "Dust blocking airflow",
    summary: "Thick dust on fins or the back can make heat feel weak.",
    prior: 0.8,
    path: "DIY",
    diySteps: [
      {
        instruction: "Unplug, let it cool fully, then wipe/vacuum visible dust from fins and the floor underneath.",
        success_check: "Dust is reduced and heat feels stronger after reheating.",
      },
    ],
  },
  {
    id: H.undersized,
    label: "Heater too small for the room",
    summary: "The unit may be working but underpowered for a large/cold room.",
    prior: 0.7,
    path: "TECHNICIAN",
  },
  {
    id: H.element_fail,
    label: "Internal heating element failed",
    summary: "Power reaches the unit but the heating parts no longer warm up — needs repair/replace.",
    prior: 0.9,
    path: "TECHNICIAN",
  },
  {
    id: H.thermostat_fail,
    label: "Faulty thermostat",
    summary: "The temperature control may be stuck or broken so it never calls for heat.",
    prior: 0.85,
    path: "TECHNICIAN",
  },
  {
    id: H.cord_fault,
    label: "Damaged cord or plug",
    summary: "A loose, frayed, or hot plug/cord can stop heating and is unsafe.",
    prior: 0.8,
    path: "TECHNICIAN",
  },
  {
    id: H.oil_leak,
    label: "Oil leak from the radiator body",
    summary: "Oil spots under an oil-filled radiator mean the sealed unit is damaged — do not keep using it.",
    prior: 0.7,
    path: "TECHNICIAN",
  },
  {
    id: H.overheat_cutout,
    label: "Overheat protection tripped",
    summary: "Covering the heater or blocking it can trip a safety cut-out until it cools.",
    prior: 0.9,
    path: "DIY",
    diySteps: [
      {
        instruction: "Unplug, remove any towels/clothes draped on it, pull it away from curtains, wait 30 minutes.",
        success_check: "After cooling and clearing space, it heats again when plugged back in.",
      },
    ],
  },
  {
    id: H.hydronic_valve,
    label: "Radiator pipe valve closed",
    summary: "On a plumbed hot-water radiator, the side valve may be shut.",
    prior: 0.75,
    path: "DIY",
    diySteps: [
      {
        instruction: "If there is a valve at the side of the radiator, open it fully (counter-clockwise usually).",
        success_check: "The radiator begins to warm along its length.",
      },
    ],
  },
  {
    id: H.hydronic_air,
    label: "Air trapped in plumbed radiator",
    summary: "A plumbed radiator that is hot at the bottom but cold at the top often needs bleeding — technician if you're unsure.",
    prior: 0.7,
    path: "TECHNICIAN",
  },
  {
    id: H.hydronic_boiler,
    label: "Boiler / heat source not running",
    summary: "The home's boiler or heat source may be off, so no hot water reaches the radiator.",
    prior: 0.7,
    path: "TECHNICIAN",
  },
  {
    id: H.hydronic_leak,
    label: "Water leak from radiator or pipes",
    summary: "Water around a plumbed radiator needs a plumber — stop using if it's near electrics.",
    prior: 0.65,
    path: "TECHNICIAN",
  },
  {
    id: H.electrical_hazard,
    label: "Water / damage creating electrical hazard",
    summary: "Water on the plug, a sparking socket, or a damaged body near power is unsafe.",
    prior: 0.5,
    path: "TECHNICIAN",
  },
  {
    id: H.fire_risk,
    label: "Burning smell, smoke, or scorching",
    summary: "Smell of burning plastic/oil, smoke, or scorch marks means stop immediately.",
    prior: 0.4,
    path: "TECHNICIAN",
  },
];

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

const questions: DiagnosticQuestion[] = [
  // —— Opening / type ——
  {
    id: "rad_type",
    prompt: "What kind of radiator is this?",
    priority: 1,
    options: [
      opt("oil_portable", "Portable oil-filled or panel heater with a power plug", [
        [H.unplugged, 1],
        [H.dead_socket, 1],
        [H.thermostat_low, 1],
        [H.tip_over, 0.8],
        [H.timer_off, 0.6],
        [H.element_fail, 0.5],
        [H.hydronic_valve, -2],
        [H.hydronic_air, -2],
        [H.hydronic_boiler, -2],
        [H.hydronic_leak, -1.5],
      ]),
      opt("plumbed_wall", "Fixed to the wall with hot-water pipes", [
        [H.hydronic_valve, 1.5],
        [H.hydronic_air, 1.2],
        [H.hydronic_boiler, 1.2],
        [H.hydronic_leak, 1],
        [H.unplugged, -2],
        [H.dead_socket, -1.5],
        [H.tip_over, -2],
        [H.timer_off, -1],
        [H.oil_leak, -1.5],
      ]),
      unsure([
        [H.unplugged, 0.3],
        [H.hydronic_valve, 0.3],
      ]),
    ],
  },
  {
    id: "rad_main_symptom",
    prompt: "What is the main problem you notice?",
    priority: 1,
    options: [
      opt("no_heat", "It stays cold — no useful heat", [
        [H.unplugged, 1],
        [H.dead_socket, 1],
        [H.thermostat_low, 1],
        [H.element_fail, 0.8],
        [H.thermostat_fail, 0.8],
        [H.hydronic_valve, 0.7],
        [H.hydronic_boiler, 0.7],
        [H.still_warming, 0.4],
      ]),
      opt("weak_heat", "It warms a little but not enough", [
        [H.dusty_blocked, 1.2],
        [H.undersized, 1.2],
        [H.thermostat_low, 0.8],
        [H.still_warming, 0.6],
        [H.hydronic_air, 0.9],
        [H.element_fail, 0.4],
      ]),
      opt("noise", "Odd noises (clicking, bubbling, buzzing)", [
        [H.hydronic_air, 1.5],
        [H.still_warming, 0.5],
        [H.cord_fault, 0.6],
        [H.electrical_hazard, 0.5],
      ]),
      opt("leak_mess", "Leak, wet floor, or oily spots underneath", [
        [H.oil_leak, 2.5],
        [H.hydronic_leak, 2],
        [H.electrical_hazard, 0.8],
        [H.thermostat_low, -1],
        [H.still_warming, -1],
        [H.element_fail, -0.5],
      ]),
      opt("smell_scare", "Smell, smoke, sparks, or it feels unsafe", [
        [H.fire_risk, 2],
        [H.electrical_hazard, 1.5],
        [H.cord_fault, 1],
        [H.overheat_cutout, 0.5],
      ]),
      unsure(),
    ],
  },
  {
    id: "rad_safety_smell",
    prompt: "Do you smell burning plastic, burning oil, or see smoke / scorch marks?",
    priority: 1,
    options: [
      opt(
        "yes_burn",
        "Yes — burning smell, smoke, or scorch marks",
        [
          [H.fire_risk, 3],
          [H.electrical_hazard, 2],
          [H.cord_fault, 1],
          [H.unplugged, -2],
          [H.thermostat_low, -2],
          [H.still_warming, -2],
        ],
        {
          emergency: true,
          reason: "Burning smell, smoke, or scorching on a heater — unplug if safe and stop using it.",
        }
      ),
      opt("no_burn", "No burning smell or smoke", [
        [H.fire_risk, -2],
        [H.still_warming, 0.3],
      ]),
      unsure([[H.fire_risk, 0.2]]),
    ],
  },
  {
    id: "rad_safety_sparks",
    prompt: "Any sparks, buzzing from the plug, or a hot / discoloured plug?",
    priority: 1,
    options: [
      opt(
        "yes_spark",
        "Yes — sparks, buzzing, or a hot/darkened plug",
        [
          [H.electrical_hazard, 3],
          [H.cord_fault, 2.5],
          [H.fire_risk, 1.5],
          [H.unplugged, -1],
        ],
        {
          emergency: true,
          reason: "Sparks or an overheating plug on a radiator is an electrical emergency — unplug at the wall if you can do so safely.",
        }
      ),
      opt("no_spark", "No — plug looks and feels normal", [
        [H.electrical_hazard, -1.5],
        [H.cord_fault, -1],
      ]),
      unsure([[H.cord_fault, 0.2]]),
    ],
  },
  {
    id: "rad_water_near_power",
    prompt: "Is there water or oily liquid on the plug, cord, or wall socket?",
    priority: 2,
    options: [
      opt(
        "yes_wet_power",
        "Yes — liquid on/near the plug or socket",
        [
          [H.electrical_hazard, 3],
          [H.oil_leak, 1],
          [H.hydronic_leak, 1],
        ],
        {
          emergency: true,
          reason: "Liquid on electrical parts — do not touch the plug; cut power at the breaker if needed and get emergency help.",
        }
      ),
      opt("no_wet_power", "No — plug and socket are dry", [
        [H.electrical_hazard, -1],
      ]),
      unsure(),
    ],
  },

  // —— Electric portable branch ——
  {
    id: "rad_power_light",
    prompt: "When you try to turn it on, does any light or display come on?",
    priority: 2,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
    },
    options: [
      opt("light_on", "Yes — a light or display comes on", [
        [H.unplugged, -2],
        [H.dead_socket, -1.5],
        [H.thermostat_low, 1],
        [H.timer_off, 0.8],
        [H.still_warming, 0.8],
        [H.element_fail, 0.6],
        [H.thermostat_fail, 0.6],
        [H.overheat_cutout, 0.5],
      ]),
      opt("light_off", "No light / completely dead", [
        [H.unplugged, 1.5],
        [H.dead_socket, 1.5],
        [H.tip_over, 1],
        [H.cord_fault, 1],
        [H.overheat_cutout, 0.6],
        [H.element_fail, 0.4],
        [H.still_warming, -1],
      ]),
      unsure([[H.unplugged, 0.3], [H.dead_socket, 0.3]]),
    ],
  },
  {
    id: "rad_socket_test",
    prompt: "Does the same wall socket work with something else (phone charger or lamp)?",
    priority: 3,
    conditions: {
      anyActiveHypothesis: [H.dead_socket, H.unplugged, H.cord_fault],
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
    },
    options: [
      opt("socket_works", "Yes — other devices work in this socket", [
        [H.dead_socket, -2.5],
        [H.unplugged, 0.8],
        [H.cord_fault, 1.2],
        [H.tip_over, 0.6],
        [H.overheat_cutout, 0.5],
      ]),
      opt("socket_dead", "No — this socket seems dead", [
        [H.dead_socket, 3],
        [H.unplugged, -1],
        [H.cord_fault, -1],
        [H.element_fail, -1],
      ]),
      unsure([[H.dead_socket, 0.4]]),
    ],
  },
  {
    id: "rad_plug_seated",
    prompt: "Is the radiator's plug fully pushed into the wall, and is its own switch ON?",
    priority: 3,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [H.unplugged, H.dead_socket, H.tip_over],
    },
    options: [
      opt("plug_ok", "Yes — plugged in firmly and switched on", [
        [H.unplugged, -2.5],
        [H.tip_over, 0.4],
        [H.cord_fault, 0.5],
      ]),
      opt("plug_loose", "It was loose / switch was off — I fixed that", [
        [H.unplugged, 3],
        [H.dead_socket, -1],
        [H.element_fail, -1],
      ]),
      unsure([[H.unplugged, 0.5]]),
    ],
  },
  {
    id: "rad_upright",
    prompt: "Is the radiator standing upright on a flat floor (not leaning or on thick carpet edges)?",
    priority: 3,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [H.tip_over, H.unplugged, H.overheat_cutout],
    },
    options: [
      opt("level_yes", "Yes — sitting level and stable", [
        [H.tip_over, -2],
      ]),
      opt("level_no", "No — it was tilted / unstable", [
        [H.tip_over, 3],
        [H.unplugged, -0.5],
      ]),
      unsure([[H.tip_over, 0.4]]),
    ],
  },
  {
    id: "rad_thermostat_position",
    prompt: "Where is the thermostat / temperature dial set?",
    priority: 3,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [
        H.thermostat_low,
        H.thermostat_fail,
        H.still_warming,
        H.element_fail,
        H.timer_off,
      ],
    },
    options: [
      opt("thermo_low", "Low / near minimum / frost setting", [
        [H.thermostat_low, 3.5],
        [H.still_warming, -0.5],
        [H.element_fail, -1.2],
        [H.thermostat_fail, -0.8],
        [H.timer_off, -0.5],
      ]),
      opt("thermo_mid_high", "Medium or high", [
        [H.thermostat_low, -2.5],
        [H.still_warming, 0.8],
        [H.element_fail, 0.7],
        [H.thermostat_fail, 0.7],
      ]),
      opt("thermo_unknown", "No dial, or I can't tell", [
        [H.timer_off, 0.6],
        [H.thermostat_fail, 0.4],
      ]),
      unsure([[H.thermostat_low, 0.5]]),
    ],
  },
  {
    id: "rad_timer_mode",
    prompt: "Is a timer, eco, or night mode enabled that might keep it off right now?",
    priority: 4,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [H.timer_off, H.thermostat_low, H.element_fail],
    },
    options: [
      opt("timer_yes", "Yes — timer/eco seems on", [
        [H.timer_off, 3],
        [H.element_fail, -1],
      ]),
      opt("timer_no", "No — it should run continuously", [
        [H.timer_off, -2],
        [H.element_fail, 0.5],
      ]),
      unsure([[H.timer_off, 0.4]]),
    ],
  },
  {
    id: "rad_waited",
    prompt: "Have you left it switched on for at least 10–15 minutes?",
    priority: 3,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [H.still_warming, H.element_fail, H.thermostat_low, H.undersized],
    },
    options: [
      opt("waited_no", "No — only a few minutes", [
        [H.still_warming, 3],
        [H.element_fail, -1.2],
        [H.thermostat_fail, -0.8],
      ]),
      opt("waited_yes_cold", "Yes — still cold after 15+ minutes", [
        [H.still_warming, -2.5],
        [H.element_fail, 1.5],
        [H.thermostat_fail, 1.2],
        [H.cord_fault, 0.5],
        [H.overheat_cutout, 0.6],
      ]),
      opt("waited_yes_warm", "Yes — it did get warm", [
        [H.still_warming, 1],
        [H.element_fail, -2],
        [H.undersized, 1],
        [H.dusty_blocked, 0.8],
        [H.thermostat_low, 0.5],
      ]),
      unsure([[H.still_warming, 0.5]]),
    ],
  },
  {
    id: "rad_covered",
    prompt: "Is anything covering the radiator (clothes, towel, blanket) or pushed tight against curtains?",
    priority: 4,
    conditions: {
      anyActiveHypothesis: [H.overheat_cutout, H.dusty_blocked, H.fire_risk, H.element_fail],
    },
    options: [
      opt("covered_yes", "Yes — something was on/against it", [
        [H.overheat_cutout, 3],
        [H.fire_risk, 0.8],
        [H.dusty_blocked, 0.5],
        [H.element_fail, -0.8],
      ]),
      opt("covered_no", "No — clear space around it", [
        [H.overheat_cutout, -2],
      ]),
      unsure([[H.overheat_cutout, 0.3]]),
    ],
  },
  {
    id: "rad_dust",
    prompt: "Do the fins / gaps look thick with dust or fluff?",
    priority: 5,
    conditions: {
      anyActiveHypothesis: [H.dusty_blocked, H.undersized, H.element_fail, H.still_warming],
    },
    options: [
      opt("dusty_yes", "Yes — quite dusty", [
        [H.dusty_blocked, 3],
        [H.undersized, -0.5],
        [H.element_fail, -0.5],
      ]),
      opt("dusty_no", "No — looks reasonably clean", [
        [H.dusty_blocked, -2],
        [H.undersized, 0.6],
      ]),
      unsure([[H.dusty_blocked, 0.3]]),
    ],
  },
  {
    id: "rad_room_size",
    prompt: "Is this a large room, or very cold / drafty (open windows, thin walls)?",
    priority: 5,
    conditions: {
      anyActiveHypothesis: [H.undersized, H.dusty_blocked, H.thermostat_low, H.still_warming],
    },
    options: [
      opt("room_large", "Yes — large or very cold room", [
        [H.undersized, 2.5],
        [H.element_fail, -0.8],
        [H.dusty_blocked, 0.4],
      ]),
      opt("room_small", "No — small/medium room that used to feel warm with this heater", [
        [H.undersized, -2],
        [H.element_fail, 0.8],
        [H.thermostat_fail, 0.5],
      ]),
      unsure([[H.undersized, 0.3]]),
    ],
  },
  {
    id: "rad_partial_heat",
    prompt: "If it warms at all: is only part of the radiator hot, or the whole surface?",
    priority: 5,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [H.element_fail, H.still_warming, H.oil_leak, H.thermostat_fail],
    },
    options: [
      opt("part_hot", "Only part of it gets hot", [
        [H.element_fail, 1.5],
        [H.oil_leak, 0.8],
        [H.still_warming, 0.5],
      ]),
      opt("all_hot", "The whole body gets evenly warm", [
        [H.element_fail, -1.5],
        [H.undersized, 1],
        [H.dusty_blocked, 0.6],
        [H.thermostat_low, 0.4],
      ]),
      opt("none_hot", "Nothing gets warm", [
        [H.element_fail, 1.5],
        [H.thermostat_fail, 1.2],
        [H.cord_fault, 0.6],
        [H.still_warming, -1],
      ]),
      unsure(),
    ],
  },
  {
    id: "rad_oil_spots",
    prompt: "Are there oily spots or stains on the floor under the radiator?",
    priority: 2,
    conditions: {
      requireAnswer: {
        questionId: "rad_main_symptom",
        optionIds: ["leak_mess"],
      },
    },
    options: [
      opt(
        "oil_yes",
        "Yes — oil or greasy spots underneath",
        [
          [H.oil_leak, 4],
          [H.element_fail, 0.5],
          [H.electrical_hazard, 0.8],
          [H.still_warming, -1],
          [H.thermostat_low, -2],
          [H.timer_off, -2],
          [H.unplugged, -1],
        ],
        {
          caution: true,
          reason: "Oil leak from a sealed radiator — stop using it and get it replaced; do not open the unit.",
        }
      ),
      opt("oil_no", "No oil spots", [[H.oil_leak, -2.5]]),
      unsure([[H.oil_leak, 0.3]]),
    ],
  },
  {
    id: "rad_oil_spots_general",
    prompt: "Any oily residue under a portable oil-filled radiator?",
    priority: 6,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      forbidAnswer: { questionId: "rad_main_symptom", optionIds: ["leak_mess"] },
      anyActiveHypothesis: [H.oil_leak, H.element_fail, H.electrical_hazard],
    },
    options: [
      opt(
        "oil_yes",
        "Yes — oil or greasy spots underneath",
        [
          [H.oil_leak, 3.5],
          [H.element_fail, 0.5],
          [H.electrical_hazard, 0.8],
          [H.still_warming, -1],
        ],
        {
          caution: true,
          reason: "Oil leak from a sealed radiator — stop using it and get it replaced; do not open the unit.",
        }
      ),
      opt("oil_no", "No oil spots", [[H.oil_leak, -2.5]]),
      unsure([[H.oil_leak, 0.3]]),
    ],
  },
  {
    id: "rad_cord_condition",
    prompt: "Does the power cord look frayed, kinked sharply, or recently damaged?",
    priority: 5,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["oil_portable", "unsure"] },
      anyActiveHypothesis: [H.cord_fault, H.electrical_hazard, H.element_fail, H.dead_socket],
    },
    options: [
      opt(
        "cord_bad",
        "Yes — damaged or questionable cord",
        [
          [H.cord_fault, 3],
          [H.electrical_hazard, 1.5],
          [H.element_fail, -0.5],
        ],
        {
          caution: true,
          reason: "Damaged heater cords should not be taped up — replace the unit or have a qualified person inspect it.",
        }
      ),
      opt("cord_ok", "Cord looks fine", [
        [H.cord_fault, -2],
        [H.element_fail, 0.4],
      ]),
      unsure([[H.cord_fault, 0.3]]),
    ],
  },
  {
    id: "rad_worked_before",
    prompt: "Did this same radiator heat the room normally earlier this season?",
    priority: 6,
    conditions: {
      anyActiveHypothesis: [H.element_fail, H.thermostat_fail, H.undersized, H.cord_fault],
    },
    options: [
      opt("worked_yes", "Yes — it worked fine before", [
        [H.element_fail, 1.2],
        [H.thermostat_fail, 1],
        [H.cord_fault, 0.6],
        [H.undersized, -1.5],
        [H.overheat_cutout, 0.5],
      ]),
      opt("worked_no", "No — it's always been weak / new problem from day one", [
        [H.undersized, 1.2],
        [H.thermostat_low, 0.5],
        [H.element_fail, 0.3],
      ]),
      unsure(),
    ],
  },

  // —— Hydronic / plumbed branch ——
  {
    id: "rad_hydronic_valve",
    prompt: "Is there a valve on the side of the radiator, and is it open?",
    priority: 2,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["plumbed_wall"] },
    },
    options: [
      opt("valve_closed", "Valve looks closed / was closed", [
        [H.hydronic_valve, 3.5],
        [H.hydronic_air, -0.5],
        [H.hydronic_boiler, -0.8],
      ]),
      opt("valve_open", "Valve is open", [
        [H.hydronic_valve, -2.5],
        [H.hydronic_air, 1],
        [H.hydronic_boiler, 1],
      ]),
      opt("valve_none", "I don't see a valve", [
        [H.hydronic_boiler, 0.8],
        [H.hydronic_air, 0.8],
      ]),
      unsure([[H.hydronic_valve, 0.5]]),
    ],
  },
  {
    id: "rad_hydronic_pattern",
    prompt: "On the plumbed radiator: is the bottom warmer than the top?",
    priority: 3,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["plumbed_wall"] },
      anyActiveHypothesis: [H.hydronic_air, H.hydronic_valve, H.hydronic_boiler],
    },
    options: [
      opt("bottom_hot_top_cold", "Bottom warm, top stays cold", [
        [H.hydronic_air, 3],
        [H.hydronic_valve, -0.5],
        [H.hydronic_boiler, -0.5],
      ]),
      opt("all_cold_pipe", "Entire radiator cold", [
        [H.hydronic_boiler, 2],
        [H.hydronic_valve, 1.5],
        [H.hydronic_air, 0.4],
      ]),
      opt("all_warm_pipe", "It gets warm along most of its length", [
        [H.hydronic_air, -2],
        [H.hydronic_boiler, -1.5],
        [H.undersized, 1],
      ]),
      unsure([[H.hydronic_air, 0.4]]),
    ],
  },
  {
    id: "rad_other_rads",
    prompt: "Are other radiators / heated towel rails in the home working?",
    priority: 3,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["plumbed_wall"] },
      anyActiveHypothesis: [H.hydronic_boiler, H.hydronic_valve, H.hydronic_air],
    },
    options: [
      opt("others_work", "Yes — other radiators are warm", [
        [H.hydronic_boiler, -2.5],
        [H.hydronic_valve, 1.5],
        [H.hydronic_air, 1.5],
      ]),
      opt("others_cold", "No — everything is cold", [
        [H.hydronic_boiler, 3],
        [H.hydronic_valve, -1],
        [H.hydronic_air, -0.5],
      ]),
      opt("only_one", "This is the only radiator", [
        [H.hydronic_boiler, 0.8],
        [H.hydronic_valve, 0.6],
      ]),
      unsure([[H.hydronic_boiler, 0.3]]),
    ],
  },
  {
    id: "rad_water_leak_floor",
    prompt: "Is there water on the floor near the radiator or its pipes?",
    priority: 2,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["plumbed_wall"] },
    },
    options: [
      opt(
        "water_yes",
        "Yes — water on the floor",
        [
          [H.hydronic_leak, 3.5],
          [H.electrical_hazard, 1],
          [H.hydronic_air, 0.3],
        ],
        {
          caution: true,
          reason: "Water leak at a radiator — catch drips with a towel/bucket and call a plumber; keep water away from electrics.",
        }
      ),
      opt(
        "water_near_elec",
        "Yes — and it's near a socket or wires",
        [
          [H.hydronic_leak, 2],
          [H.electrical_hazard, 3],
        ],
        {
          emergency: true,
          reason: "Water near electricity at a radiator — avoid the area and treat as emergency.",
        }
      ),
      opt("water_no", "No water on the floor", [[H.hydronic_leak, -2.5]]),
      unsure([[H.hydronic_leak, 0.3]]),
    ],
  },
  {
    id: "rad_hiss_gurgle",
    prompt: "Do you hear hissing, gurgling, or bubbling from the radiator?",
    priority: 4,
    conditions: {
      requireAnswer: { questionId: "rad_type", optionIds: ["plumbed_wall"] },
      anyActiveHypothesis: [H.hydronic_air, H.hydronic_leak, H.hydronic_boiler],
    },
    options: [
      opt("gurgle_yes", "Yes — air/water sounds", [
        [H.hydronic_air, 2.5],
        [H.hydronic_leak, 0.5],
      ]),
      opt("gurgle_no", "No unusual sounds", [
        [H.hydronic_air, -1.5],
      ]),
      unsure([[H.hydronic_air, 0.3]]),
    ],
  },

  // —— Closing differentiators ——
  {
    id: "rad_after_basic_checks",
    prompt: "After checking power/valve basics, does it still feel completely dead?",
    priority: 7,
    conditions: {
      minAsked: 4,
      anyActiveHypothesis: [H.element_fail, H.thermostat_fail, H.cord_fault, H.hydronic_boiler],
    },
    options: [
      opt("still_dead", "Yes — still no useful heat", [
        [H.element_fail, 1.5],
        [H.thermostat_fail, 1.2],
        [H.cord_fault, 0.8],
        [H.hydronic_boiler, 1],
        [H.unplugged, -1],
        [H.thermostat_low, -1],
        [H.still_warming, -1],
      ]),
      opt("improved", "It improved after a simple fix", [
        [H.unplugged, 1],
        [H.thermostat_low, 1],
        [H.tip_over, 0.8],
        [H.hydronic_valve, 0.8],
        [H.overheat_cutout, 0.8],
        [H.element_fail, -2],
      ]),
      unsure(),
    ],
  },
  {
    id: "rad_comfort_diy",
    prompt: "Are you comfortable trying simple checks (plug, dial, clear space) yourself?",
    priority: 8,
    conditions: {
      minAsked: 3,
      anyActiveHypothesis: [
        H.unplugged,
        H.thermostat_low,
        H.tip_over,
        H.still_warming,
        H.overheat_cutout,
        H.dusty_blocked,
        H.hydronic_valve,
      ],
    },
    options: [
      opt("diy_ok", "Yes — if it's simple and safe", [
        [H.unplugged, 0.4],
        [H.thermostat_low, 0.4],
        [H.tip_over, 0.3],
        [H.still_warming, 0.3],
        [H.element_fail, -0.3],
      ]),
      opt("diy_no", "I'd rather get a technician", [
        [H.element_fail, 0.6],
        [H.thermostat_fail, 0.6],
        [H.cord_fault, 0.5],
        [H.hydronic_boiler, 0.5],
        [H.unplugged, -0.4],
      ]),
      unsure(),
    ],
  },
];

export const radiatorKb: DiagnosticKnowledgeBase = {
  id: "plumbing.radiator",
  domain: "plumbing",
  title: "Room radiator / oil heater",
  description:
    "Diagnostic graph for portable oil-filled radiators and plumbed hot-water radiators — homeowner-observable only.",
  hypotheses,
  questions,
  config: {
    maxQuestions: 12,
    confidenceMargin: 2.2,
    minLeaderScore: 4.5,
    minUtility: 0.3,
    topK: 5,
    minQuestionsForConfidence: 5,
  },
};
