// Asks the model whether two enquiries are the same person. Used only for unclear cases the code cannot settle.

import { generateJson } from "@/lib/ai/client";
import { buildDuplicatePrompt } from "@/lib/ai/prompts";
import { DuplicateJudgementJsonSchema, DuplicateJudgementSchema } from "@/lib/ai/schemas";
import type { LeadInput } from "@/types";

export async function judgeDuplicate(incoming: LeadInput, existing: LeadInput) {
  const { system, user } = buildDuplicatePrompt(incoming, existing);
  const { data } = await generateJson({
    system,
    user,
    schema: DuplicateJudgementSchema,
    jsonSchema: DuplicateJudgementJsonSchema,
    temperature: 0,
  });
  return data;
}
