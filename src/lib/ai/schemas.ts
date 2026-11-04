// Zod schemas for every AI output (ARCHITECTURE.md section 5), plus the plain JSON schema sent to the model.

import { z } from "zod";

const signal = z.object({
  score: z.number().int().min(0).max(3),
  reason: z.string(),
});

export const LeadAnalysisSchema = z.object({
  summary: z.string(),
  intent: z.enum(["buy_to_live", "investment", "rent", "just_browsing", "unclear"]),
  intent_note: z.string(),
  key_requirements: z.array(z.string()).max(6),
  objections: z.array(z.string()).max(5),
  next_action: z.string(),
  suggested_response: z.string(),
  signals: z.object({
    intent_strength: signal,
    budget_fit: signal,
    timeline_urgency: signal,
    engagement: signal,
  }),
  red_flags: z.array(z.string()),
  language: z.string(),
});

export const ParsedLeadsSchema = z.object({
  leads: z.array(
    z.object({
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      location: z.string(),
      property_req: z.string(),
      budget_text: z.string(),
      timeline_text: z.string(),
      message: z.string(),
      missing_fields: z.array(z.string()),
    }),
  ),
  unparsed_text: z.string(),
});

export const DuplicateJudgementSchema = z.object({
  is_same_person: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export const DebriefResultSchema = z.object({
  call_outcome: z.enum([
    "interested",
    "needs_time",
    "site_visit_booked",
    "not_interested",
    "no_answer",
  ]),
  updated_analysis: LeadAnalysisSchema,
  new_objections: z.array(z.string()),
  follow_up_in_days: z.number().int().min(0).max(30),
  follow_up_reason: z.string(),
  follow_up_message: z.string(),
  suggested_status: z.enum(["contacted", "negotiating", "won", "lost"]),
});

export const MorningBriefingSchema = z.object({
  headline: z.string(),
  items: z.array(
    z.object({
      lead_id: z.string(),
      order: z.number().int(),
      why_now: z.string(),
      opening_line: z.string(),
      draft_message: z.string(),
    }),
  ),
});

// Plain JSON schema for the model's response format. Built from the Zod schema so the two never drift apart.
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}

export const LeadAnalysisJsonSchema = toJsonSchema(LeadAnalysisSchema);
export const ParsedLeadsJsonSchema = toJsonSchema(ParsedLeadsSchema);
export const DuplicateJudgementJsonSchema = toJsonSchema(DuplicateJudgementSchema);
export const DebriefResultJsonSchema = toJsonSchema(DebriefResultSchema);
export const MorningBriefingJsonSchema = toJsonSchema(MorningBriefingSchema);
