// POST /api/intake/parse: turn a messy pasted dump into draft leads. Nothing is saved here.

import { z } from "zod";
import { generateJson } from "@/lib/ai/client";
import { buildParsePrompt } from "@/lib/ai/prompts";
import { ParsedLeadsJsonSchema, ParsedLeadsSchema } from "@/lib/ai/schemas";
import { errorResponse, fail, ok } from "@/lib/api";
import { describeIssues } from "@/lib/validation";

export const maxDuration = 60;

const MAX_LEADS = 15;

const ParseBodySchema = z.object({ text: z.string().trim().min(20, "Paste at least 20 characters").max(15000) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }
  const parsed = ParseBodySchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));

  try {
    const { system, user } = buildParsePrompt(parsed.data.text);
    const { data } = await generateJson({
      system,
      user,
      schema: ParsedLeadsSchema,
      jsonSchema: ParsedLeadsJsonSchema,
    });
    const truncated = data.leads.length > MAX_LEADS;
    return ok({ leads: data.leads.slice(0, MAX_LEADS), unparsed_text: data.unparsed_text, truncated });
  } catch (err) {
    return errorResponse(err);
  }
}
