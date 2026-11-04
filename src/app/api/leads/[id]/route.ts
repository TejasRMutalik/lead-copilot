// GET /api/leads/[id]: one lead with its events and chat messages. PATCH: change the lead's status.

import { revalidatePath } from "next/cache";
import { errorResponse, fail, ok } from "@/lib/api";
import { listMessages } from "@/lib/repo/chat";
import { addEvent, listEvents } from "@/lib/repo/events";
import { getLead, updateStatus } from "@/lib/repo/leads";
import { StatusUpdateSchema, describeIssues, isUuid } from "@/lib/validation";

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

export async function PATCH(request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("NOT_FOUND", "Lead not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }
  const parsed = StatusUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));

  try {
    const current = await getLead(id);
    if (!current) return fail("NOT_FOUND", "Lead not found.", 404);
    if (current.status === parsed.data.status) return ok(current);

    const updated = await updateStatus(id, parsed.data.status);
    await addEvent(id, "status_change", { from: current.status, to: parsed.data.status }, current.score);
    revalidatePath("/");
    return ok(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
