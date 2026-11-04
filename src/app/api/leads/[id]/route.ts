// GET /api/leads/[id]: one lead with its timeline events and chat messages.

import { errorResponse, fail, ok } from "@/lib/api";
import { listMessages } from "@/lib/repo/chat";
import { listEvents } from "@/lib/repo/events";
import { getLead } from "@/lib/repo/leads";
import { isUuid } from "@/lib/validation";

export async function GET(_request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("NOT_FOUND", "Lead not found.", 404);

  try {
    const lead = await getLead(id);
    if (!lead) return fail("NOT_FOUND", "Lead not found.", 404);
    const [events, messages] = await Promise.all([listEvents(id), listMessages(id, 50)]);
    return ok({ lead, events, messages });
  } catch (err) {
    return errorResponse(err);
  }
}
