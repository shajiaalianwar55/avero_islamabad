import { z } from "zod";
import { completeValidatedJson, detectFixture } from "@/lib/ai/provider";
import type { IncidentIntake, SafetyAssessment, TriageDecision } from "@/types";

const triageSchema: z.ZodType<TriageDecision> = z.object({
  outcome: z.enum(["DIY", "TECHNICIAN", "EMERGENCY"]),
  likely_issue: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  observed_facts: z.array(z.string()),
  concerns: z.array(z.string()),
  recommended_next_step: z.string(),
  technician_trade: z.string().optional(),
});

export type TriageInput = {
  description: string;
  messages: Array<{ role: string; content: string }>;
  intake?: IncidentIntake | null;
  safety?: SafetyAssessment | null;
  historyNotes?: string[];
};

export function fallbackTriage(input: TriageInput): TriageDecision {
  const blob = [
    input.description,
    ...input.messages.map((m) => m.content),
  ]
    .join(" ")
    .toLowerCase();

  if (input.safety?.level === "emergency" || input.safety?.stop_troubleshooting) {
    return {
      outcome: "EMERGENCY",
      likely_issue: "Immediate electrical or environmental hazard",
      confidence: "high",
      observed_facts: input.safety.hazard_codes,
      concerns: ["Continuing DIY is unsafe"],
      recommended_next_step:
        "Stop troubleshooting and contact emergency / licensed professional help",
      technician_trade: input.intake?.category_guess === "electrical" ? "electrical" : undefined,
    };
  }

  const fixture = detectFixture(blob);

  if (fixture === "buzzing_socket") {
    return {
      outcome: "EMERGENCY",
      likely_issue: "Possible overheating or arcing electrical outlet",
      confidence: "high",
      observed_facts: ["Socket buzzing", "Burning smell reported"],
      concerns: ["Fire and electrocution risk"],
      recommended_next_step: "Cut power if safe and call a licensed electrician now",
      technician_trade: "electrical",
    };
  }

  if (fixture === "dirty_ac_filter") {
    return {
      outcome: "DIY",
      likely_issue: "Restricted airflow from a dirty AC filter",
      confidence: "high",
      observed_facts: ["Weak airflow", "Filter appears dirty", "No electrical warning signs"],
      concerns: ["If cleaning does not help, a technician may still be needed"],
      recommended_next_step: "Follow guided DIY filter check and cleaning steps",
    };
  }

  if (fixture === "sink_leak") {
    return {
      outcome: "TECHNICIAN",
      likely_issue: "Likely loose or failed under-sink plumbing connection (P-trap / supply line)",
      confidence: "medium",
      observed_facts: ["Kitchen sink leaking when water runs"],
      concerns: ["Ongoing water damage if left unaddressed"],
      recommended_next_step: "Create a plumbing service request for an Islamabad technician",
      technician_trade: "plumbing",
    };
  }

  return {
    outcome: "TECHNICIAN",
    likely_issue: "Household issue likely needs on-site diagnosis",
    confidence: "low",
    observed_facts: [input.description.slice(0, 160)],
    concerns: ["Limited information for a confident DIY path"],
    recommended_next_step: "Request a matching technician",
    technician_trade: input.intake?.category_guess ?? "unknown",
  };
}

export async function classifyTriage(input: TriageInput): Promise<TriageDecision> {
  return completeValidatedJson({
    system: `You are Avero's triage outcome classifier.
Outcomes: DIY | TECHNICIAN | EMERGENCY.
Do not show chain-of-thought. Return JSON with facts, concerns, decision, next step.
If safety says emergency, outcome must be EMERGENCY.`,
    user: JSON.stringify(input),
    schema: triageSchema,
    fallback: () => fallbackTriage(input),
  });
}

/** Alias used by tests / triage pipeline */
export async function classifyOutcome(input: {
  description: string;
  intake?: IncidentIntake | null;
  answers?: string[];
  emergency?: boolean;
}): Promise<TriageDecision> {
  return classifyTriage({
    description: input.description,
    messages: (input.answers ?? []).map((content) => ({
      role: "user",
      content,
    })),
    intake: input.intake,
    safety: input.emergency
      ? {
          level: "emergency",
          hazard_codes: ["emergency_flag"],
          stop_troubleshooting: true,
          safe_immediate_actions: [],
          prohibited_actions: [],
        }
      : null,
  });
}
