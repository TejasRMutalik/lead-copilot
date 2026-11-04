// GET /api/leads lists leads (filters: tier, status, q). POST checks for duplicates, then saves a new lead and analyzes it.

import { revalidatePath } from "next/cache";
import { AiError } from "@/lib/ai/client";
import { errorResponse, fail, ok } from "@/lib/api";
import { findDuplicates } from "@/lib/find-duplicates";
import { addEvent } from "@/lib/repo/events";
import { createLead, listLeads } from "@/lib/repo/leads";
import { runAnalysis } from "@/lib/run-analysis";
import { CreateLeadSchema, ListQuerySchema, describeIssues } from "@/lib/validation";

export const maxDuration = 60;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = ListQuerySchema.safeParse({
    tier: params.get("tier") || undefined,
    status: params.get("status") || undefined,
    q: params.get("q") || undefined,
  });
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));

  try {
    return ok(await listLeads(parsed.data));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }

  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));
  const input = parsed.data;
  const source = input.source;

  try {
    // Possible duplicates are returned without saving; the client asks the user what to do.
    if (!input.skipDuplicateCheck) {
      const duplicateCandidates = await findDuplicates(input);
      if (duplicateCandidates.length > 0) return ok({ duplicateCandidates });
    }

    const lead = await createLead(input, source);
    await addEvent(lead.id, "created", { source });
    revalidatePath("/");

    // Save first, analyze second: if the AI fails the lead still exists.
    try {
      const analyzed = await runAnalysis(lead);
      return ok(analyzed);
    } catch (err) {
      if (err instanceof AiError) return ok(lead, err.code);
      throw err;
    }
  } catch (err) {
    return errorResponse(err);
  }
}
