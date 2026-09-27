import { z } from "zod";
import { completeValidatedJson, detectFixture } from "@/lib/ai/provider";
import type { DiyPlan, DiyReassessment, TriageDecision } from "@/types";

const diyStepSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string(),
  success_check: z.string(),
  failure_action: z.enum(["ASK_NEXT", "ESCALATE", "STOP"]),
});

const diyPlanSchema: z.ZodType<DiyPlan> = z.object({
  title: z.string(),
  estimated_minutes: z.number().optional(),
  tools: z.array(z.string()),
  safety_notes: z.array(z.string()),
  steps: z.array(diyStepSchema).min(1),
});

const reassessmentSchema: z.ZodType<DiyReassessment> = z.object({
  status: z.enum(["CONTINUE", "RESOLVED", "ESCALATE_TECHNICIAN", "EMERGENCY"]),
  next_step_number: z.number().int().positive().optional(),
  reason_summary: z.string(),
});

export function fallbackDiyPlan(
  description: string,
  decision?: TriageDecision | null
): DiyPlan {
  const fixture = detectFixture(description);
  if (fixture === "dirty_ac_filter" || decision?.outcome === "DIY") {
    return {
      title: "AC filter check and clean",
      estimated_minutes: 20,
      tools: ["Step stool", "Soft brush or vacuum", "Mild soap and water"],
      safety_notes: [
        "Turn off the AC at the remote and wall switch before opening the filter",
        "Do not open sealed electrical panels",
      ],
      steps: [
        {
          order: 1,
          instruction: "Turn off the AC and open the front panel to access the filter.",
          success_check: "Filter is visible and removable without force.",
          failure_action: "ESCALATE",
        },
        {
          order: 2,
          instruction: "Remove the filter and check for dust buildup.",
          success_check: "Filter is out and dust level is visible.",
          failure_action: "ASK_NEXT",
        },
        {
          order: 3,
          instruction:
            "Gently clean the filter with a vacuum or wash with mild soap; let it dry fully.",
          success_check: "Filter looks cleaner and is completely dry.",
          failure_action: "ESCALATE",
        },
        {
          order: 4,
          instruction: "Reinstall the filter, close the panel, and run the AC on cool.",
          success_check: "Airflow feels stronger within a few minutes.",
          failure_action: "ESCALATE",
        },
      ],
    };
  }

  return {
    title: "Safe basic inspection",
    estimated_minutes: 10,
    tools: ["Phone flashlight"],
    safety_notes: ["Stop immediately if you smell burning, see sparks, or feel unsafe"],
    steps: [
      {
        order: 1,
        instruction: "Visually inspect the area without touching damaged parts.",
        success_check: "You can describe what you see clearly.",
        failure_action: "ESCALATE",
      },
      {
        order: 2,
        instruction: "Note any leaks, noises, or warning lights.",
        success_check: "Observations recorded.",
        failure_action: "ASK_NEXT",
      },
    ],
  };
}

export async function planDiy(
  description: string,
  decision?: TriageDecision | null
): Promise<DiyPlan> {
  return completeValidatedJson({
    system: `You are Avero's DIY planner. One-step-at-a-time safe guidance only.
Never include steps that require opening live electrical panels or gas work.
Return JSON matching DiyPlan.`,
    user: JSON.stringify({ description, decision }),
    schema: diyPlanSchema,
    fallback: () => fallbackDiyPlan(description, decision),
  });
}

export function fallbackDiyReassessment(input: {
  stepOrder: number;
  totalSteps: number;
  userResponse: string;
}): DiyReassessment {
  const t = input.userResponse.toLowerCase();
  if (/burn|spark|smoke|shock|gas/.test(t)) {
    return {
      status: "EMERGENCY",
      reason_summary: "New hazard signs reported during DIY",
    };
  }
  // Explicit user confirmation that the issue is fixed — always resolve
  if (/issue has been solved|already fixed|problem is solved|fully fixed/.test(t)) {
    return {
      status: "RESOLVED",
      reason_summary: "User confirmed the issue has been solved",
    };
  }
  if (/no|fail|worse|still|not working|didn't|cannot|can't/.test(t)) {
    if (input.stepOrder >= input.totalSteps) {
      return {
        status: "ESCALATE_TECHNICIAN",
        reason_summary: "DIY steps completed without resolution",
      };
    }
    return {
      status: "ESCALATE_TECHNICIAN",
      reason_summary: "Step unsuccessful — technician recommended",
    };
  }
  if (/yes|done|ok|fixed|better|resolved|working/.test(t)) {
    if (input.stepOrder >= input.totalSteps) {
      return {
        status: "RESOLVED",
        reason_summary: "All DIY steps completed successfully",
      };
    }
    return {
      status: "CONTINUE",
      next_step_number: input.stepOrder + 1,
      reason_summary: "Step succeeded — continue to next step",
    };
  }
  if (input.stepOrder >= input.totalSteps) {
    return {
      status: "RESOLVED",
      reason_summary: "Final step acknowledged",
    };
  }
  return {
    status: "CONTINUE",
    next_step_number: input.stepOrder + 1,
    reason_summary: "Proceeding to next step",
  };
}

export async function reassessDiy(input: {
  description: string;
  stepOrder: number;
  totalSteps: number;
  stepInstruction: string;
  userResponse: string;
}): Promise<DiyReassessment> {
  return completeValidatedJson({
    system: `You reassess DIY progress. Return DiyReassessment JSON.
Statuses: CONTINUE | RESOLVED | ESCALATE_TECHNICIAN | EMERGENCY.`,
    user: JSON.stringify(input),
    schema: reassessmentSchema,
    fallback: () =>
      fallbackDiyReassessment({
        stepOrder: input.stepOrder,
        totalSteps: input.totalSteps,
        userResponse: input.userResponse,
      }),
  });
}
