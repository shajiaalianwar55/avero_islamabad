import { z } from "zod";

export const incidentIntakeSchema = z.object({
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

export const nextQuestionSchema = z.object({
  should_ask: z.boolean(),
  question: z.string().optional(),
  reason_code: z
    .enum([
      "identify_source",
      "assess_severity",
      "check_safety",
      "differentiate_causes",
      "check_user_action",
      "enough_information",
    ])
    .optional(),
  expected_answer_type: z.enum(["yes_no", "choice", "short_text"]).optional(),
  choices: z.array(z.string()).optional(),
});

export const safetyAssessmentSchema = z.object({
  level: z.enum(["normal", "caution", "emergency"]),
  hazard_codes: z.array(z.string()),
  stop_troubleshooting: z.boolean(),
  safe_immediate_actions: z.array(z.string()),
  prohibited_actions: z.array(z.string()),
});

export const triageDecisionSchema = z.object({
  outcome: z.enum(["DIY", "TECHNICIAN", "EMERGENCY"]),
  likely_issue: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  observed_facts: z.array(z.string()),
  concerns: z.array(z.string()),
  recommended_next_step: z.string(),
  technician_trade: z.string().optional(),
});

export const diyPlanSchema = z.object({
  title: z.string(),
  estimated_minutes: z.number().optional(),
  tools: z.array(z.string()),
  safety_notes: z.array(z.string()),
  steps: z.array(
    z.object({
      order: z.number(),
      instruction: z.string(),
      success_check: z.string(),
      failure_action: z.enum(["ASK_NEXT", "ESCALATE", "STOP"]),
    })
  ),
});

export const diyReassessmentSchema = z.object({
  status: z.enum(["CONTINUE", "RESOLVED", "ESCALATE_TECHNICIAN", "EMERGENCY"]),
  next_step_number: z.number().optional(),
  reason_summary: z.string(),
});
