// POST /api/duplicates/check: returns existing leads that may be the same person as the given enquiry.

import { errorResponse, fail, ok } from "@/lib/api";
import { findDuplicates } from "@/lib/find-duplicates";
import { LeadInputSchema, describeIssues } from "@/lib/validation";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }
  const parsed = LeadInputSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));

  try {
    return ok({ candidates: await findDuplicates(parsed.data) });
  } catch (err) {
    return errorResponse(err);
  }
}
