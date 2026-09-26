import { z } from "zod";
import { completeValidatedJson, detectFixture } from "@/lib/ai/provider";
import type { IncidentIntake } from "@/types";

const intakeSchema: z.ZodType<IncidentIntake> = z.object({
  category_guess: z.enum([
    "plumbing",
    "electrical",
    "ac",
    "water_pump",
    "geyser",
    "ups_inverter",
    "solar",
    "appliance",
    "structural",
    "unknown",
  ]),
  symptoms: z.array(z.string()),
  location_in_home: z.string().optional(),
  detected_hazards: z.array(z.string()),
  missing_information: z.array(z.string()),
});

export function fallbackIntake(description: string): IncidentIntake {
  const fixture = detectFixture(description);
  if (fixture === "sink_leak") {
    return {
      category_guess: "plumbing",
      symptoms: ["leak when water runs", "kitchen sink"],
      location_in_home: "kitchen",
      detected_hazards: [],
      missing_information: [
        "Is the leak under the sink or from the faucet?",
        "Is water pooling on the floor?",
      ],
    };
  }
  if (fixture === "dirty_ac_filter") {
    return {
      category_guess: "ac",
      symptoms: ["weak airflow", "dirty filter"],
      location_in_home: "bedroom",
      detected_hazards: [],
      missing_information: ["Has the filter been cleaned recently?"],
    };
  }
  if (fixture === "buzzing_socket") {
    return {
      category_guess: "electrical",
      symptoms: ["buzzing socket", "burning smell"],
      detected_hazards: ["burning_smell", "electrical_buzz"],
      missing_information: [],
    };
  }

  const t = description.toLowerCase();
  let category_guess: IncidentIntake["category_guess"] = "unknown";
  if (/leak|pipe|drain|sink|toilet|tap|faucet/.test(t)) category_guess = "plumbing";
  else if (/socket|wire|breaker|electric|spark/.test(t)) category_guess = "electrical";
  else if (/\bac\b|air\s*cond|cooling/.test(t)) category_guess = "ac";
  else if (/pump|motor|tank/.test(t)) category_guess = "water_pump";
  else if (/geyser|heater/.test(t)) category_guess = "geyser";
  else if (/ups|inverter/.test(t)) category_guess = "ups_inverter";
  else if (/solar|panel/.test(t)) category_guess = "solar";
  else if (/fridge|washer|oven|appliance/.test(t)) category_guess = "appliance";

  return {
    category_guess,
    symptoms: [description.slice(0, 120)],
    detected_hazards: [],
    missing_information: ["When did this start?", "Any unusual smells or sounds?"],
  };
}

export async function parseIncidentIntake(
  description: string
): Promise<IncidentIntake> {
  return completeValidatedJson({
    system: `You are Avero's incident parser for Islamabad homes.
Return JSON matching IncidentIntake. Do not invent hazards.
Categories: plumbing, electrical, ac, water_pump, geyser, ups_inverter, solar, appliance, structural, unknown.`,
    user: `Description:\n${description}`,
    schema: intakeSchema,
    fallback: () => fallbackIntake(description),
  });
}

/** Alias used by tests / triage pipeline */
export const parseIncident = parseIncidentIntake;
