import { z } from "zod";
import { completeValidatedJson } from "@/lib/ai/provider";
import type {
  IncidentIntake,
  ServiceRequestContract,
  TriageDecision,
} from "@/types";

const contractSchema: z.ZodType<ServiceRequestContract> = z.object({
  incident_id: z.string(),
  city: z.literal("Islamabad"),
  area: z.string(),
  category: z.string(),
  title: z.string(),
  problem_summary: z.string(),
  symptoms: z.array(z.string()),
  likely_issue: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]),
  hazard_notes: z.array(z.string()),
  actions_already_tried: z.array(z.string()),
  preferred_time: z.string().optional(),
  image_urls: z.array(z.string()),
  created_at: z.string(),
});

export type ServiceRequestInput = {
  incident_id: string;
  area: string;
  description: string;
  intake?: IncidentIntake | null;
  decision?: TriageDecision | null;
  actions_tried?: string[];
  preferred_time?: string;
  image_urls?: string[];
};

export function fallbackServiceRequest(
  input: ServiceRequestInput
): ServiceRequestContract {
  const category =
    input.decision?.technician_trade ||
    input.intake?.category_guess ||
    "unknown";
  const title =
    category === "plumbing"
      ? "Kitchen sink leak"
      : category === "electrical"
        ? "Electrical outlet issue"
        : category === "ac"
          ? "AC cooling issue"
          : `Home ${category} issue`;

  return {
    incident_id: input.incident_id,
    city: "Islamabad",
    area: input.area,
    category,
    title,
    problem_summary: input.description,
    symptoms: input.intake?.symptoms ?? [input.description.slice(0, 120)],
    likely_issue: input.decision?.likely_issue,
    urgency:
      input.decision?.outcome === "EMERGENCY"
        ? "high"
        : category === "plumbing"
          ? "medium"
          : "medium",
    hazard_notes: input.intake?.detected_hazards ?? [],
    actions_already_tried: input.actions_tried ?? [],
    preferred_time: input.preferred_time,
    image_urls: input.image_urls ?? [],
    created_at: new Date().toISOString(),
  };
}

export async function buildServiceRequest(
  input: ServiceRequestInput
): Promise<ServiceRequestContract> {
  return completeValidatedJson({
    system: `You create structured Islamabad service request contracts for technicians.
Never invent missing facts. city must be "Islamabad". Return ServiceRequestContract JSON.`,
    user: JSON.stringify(input),
    schema: contractSchema,
    fallback: () => fallbackServiceRequest(input),
  });
}
