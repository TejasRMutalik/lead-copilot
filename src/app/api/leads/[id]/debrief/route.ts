// POST /api/leads/[id]/debrief: turn rough call notes (or a plain "no answer") into an updated lead.

import { revalidatePath } from "next/cache";
import { errorResponse, fail, ok } from "@/lib/api";
import { listEvents } from "@/lib/repo/events";
import { getLead } from "@/lib/repo/leads";
import { runDebrief, runNoAnswer } from "@/lib/run-debrief";
import { DebriefBodySchema, describeIssues, isUuid } from "@/lib/validation";

export const maxDuration = 60;

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/debrief">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("NOT_FOUND", "Lead not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }
  const parsed = DebriefBodySchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));

  try {
    const lead = await getLead(id);
    if (!lead) return fail("NOT_FOUND", "Lead not found.", 404);
    const events = await listEvents(id);

    // "No answer" never calls the AI.
    const { lead: updated, summary } =
      parsed.data.outcome === "no_answer"
        ? await runNoAnswer(lead, events)
        : await runDebrief(lead, events, parsed.data.notes ?? "");

    revalidatePath("/");
    return ok({ lead: updated, result: summary });
  } catch (err) {
    return errorResponse(err);
  }
}
