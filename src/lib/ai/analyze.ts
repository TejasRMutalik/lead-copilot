// analyzeLead(): prompt + model call + score computed in code. Returns everything a route needs to save.

import { generateJson } from "@/lib/ai/client";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { LeadAnalysisJsonSchema, LeadAnalysisSchema } from "@/lib/ai/schemas";
import { computeScore, tierFor } from "@/lib/scoring";
import type { LeadAnalysis, LeadInput, Tier } from "@/types";

export async function analyzeLead(
  lead: LeadInput,
): Promise<{ analysis: LeadAnalysis; score: number; tier: Tier; model: string }> {
  const { system, user } = buildAnalysisPrompt(lead);
  const { data, model } = await generateJson({
    system,
    user,
    schema: LeadAnalysisSchema,
    jsonSchema: LeadAnalysisJsonSchema,
  });
  const score = computeScore(data.signals, data.red_flags);
  return { analysis: data, score, tier: tierFor(score), model };
}
