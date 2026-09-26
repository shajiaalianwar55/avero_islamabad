import { z } from "zod";
import { completeValidatedJson, detectFixture } from "@/lib/ai/provider";
import type { IncidentIntake, NextQuestion } from "@/types";

const questionSchema: z.ZodType<NextQuestion> = z.object({
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

export type QuestionPlannerInput = {
  description: string;
  intake?: IncidentIntake | null;
  priorQuestions: string[];
  priorAnswers: string[];
  messageCount: number;
};

export function fallbackNextQuestion(input: QuestionPlannerInput): NextQuestion {
  const blob = [
    input.description,
    ...input.priorAnswers,
    ...input.priorQuestions,
  ]
    .join(" ")
    .toLowerCase();

  const fixture = detectFixture(blob);

  if (fixture === "buzzing_socket") {
    return {
      should_ask: false,
      reason_code: "enough_information",
    };
  }

  if (input.messageCount >= 4 || input.priorAnswers.length >= 2) {
    return {
      should_ask: false,
      reason_code: "enough_information",
    };
  }

  if (fixture === "sink_leak") {
    if (!/under|faucet|tap|cabinet/.test(blob)) {
      return {
        should_ask: true,
        question: "Is the leak coming from under the sink or from the faucet/tap?",
        reason_code: "identify_source",
        expected_answer_type: "choice",
        choices: ["Under the sink", "Faucet/tap", "Not sure"],
      };
    }
    if (!/floor|pool|cabinet|drip/.test(blob)) {
      return {
        should_ask: true,
        question: "Is water pooling on the floor or only dripping inside the cabinet?",
        reason_code: "assess_severity",
        expected_answer_type: "choice",
        choices: ["Pooling on floor", "Only in cabinet", "Just dripping"],
      };
    }
    return { should_ask: false, reason_code: "enough_information" };
  }

  if (fixture === "dirty_ac_filter") {
    if (!/filter|cleaned|washed/.test(input.priorAnswers.join(" ").toLowerCase()) &&
      input.priorAnswers.length === 0) {
      return {
        should_ask: true,
        question: "Can you see if the AC filter looks dusty or clogged?",
        reason_code: "differentiate_causes",
        expected_answer_type: "yes_no",
      };
    }
    return { should_ask: false, reason_code: "enough_information" };
  }

  if (input.priorAnswers.length === 0) {
    return {
      should_ask: true,
      question: "When did you first notice this problem?",
      reason_code: "assess_severity",
      expected_answer_type: "short_text",
    };
  }

  return { should_ask: false, reason_code: "enough_information" };
}

export async function planNextQuestion(
  input: QuestionPlannerInput
): Promise<NextQuestion> {
  return completeValidatedJson({
    system: `You are Avero's adaptive question planner.
Ask at most one question. No repetition. Safety first. Stop when enough information exists.
Return JSON matching NextQuestion.`,
    user: JSON.stringify({
      description: input.description,
      intake: input.intake,
      priorQuestions: input.priorQuestions,
      priorAnswers: input.priorAnswers,
      messageCount: input.messageCount,
    }),
    schema: questionSchema,
    fallback: () => fallbackNextQuestion(input),
  });
}
