// POST /api/leads/[id]/analyze: run (or re-run) the AI analysis for an existing lead.

import { errorResponse, fail, ok } from "@/lib/api";
import { getLead } from "@/lib/repo/leads";
import { runAnalysis } from "@/lib/run-analysis";
import { isUuid } from "@/lib/validation";

export const maxDuration = 60;

export async function POST(_request: Request, ctx: RouteContext<"/api/leads/[id]/analyze">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("NOT_FOUND", "Lead not found.", 404);

  try {
    const lead = await getLead(id);
    if (!lead) return fail("NOT_FOUND", "Lead not found.", 404);
    return ok(await runAnalysis(lead));
  } catch (err) {
    return errorResponse(err);
  }
}
