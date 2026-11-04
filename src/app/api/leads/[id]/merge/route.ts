// POST /api/leads/[id]/merge: fold a repeat enquiry into an existing lead, then re-run the analysis.

import { revalidatePath } from "next/cache";
import { AiError } from "@/lib/ai/client";
import { errorResponse, fail, ok } from "@/lib/api";
import { todayIST } from "@/lib/dates";
import { addEvent } from "@/lib/repo/events";
import { getLead, mergeIntoLead } from "@/lib/repo/leads";
import { runAnalysis } from "@/lib/run-analysis";
import { MergeLeadSchema, describeIssues, isUuid } from "@/lib/validation";
import type { LeadInput } from "@/types";

export const maxDuration = 60;

// "Unknown" is what the paste screen asks users to type when a field is not known, so it never overwrites real data.
function hasValue(text: string): boolean {
  const cleaned = text.trim().toLowerCase();
  return cleaned !== "" && cleaned !== "unknown";
}

type Changeable = "property_req" | "budget_text" | "timeline_text";
const CHANGEABLE: Changeable[] = ["property_req", "budget_text", "timeline_text"];

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/merge">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("NOT_FOUND", "Lead not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }
  const parsed = MergeLeadSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));
  const { source, ...incoming }: { source: "form" | "paste" } & LeadInput = parsed.data;

  try {
    const lead = await getLead(id);
    if (!lead) return fail("NOT_FOUND", "Lead not found.", 404);

    // Fill only what is empty; for the three "wants" fields the newer value wins and the old one is kept in the event.
    const previous: Partial<Record<Changeable, string>> = {};
    const values = {
      property_req: lead.property_req,
      budget_text: lead.budget_text,
      timeline_text: lead.timeline_text,
    };
    for (const field of CHANGEABLE) {
      const newer = incoming[field];
      if (hasValue(newer) && newer.trim().toLowerCase() !== values[field].trim().toLowerCase()) {
        previous[field] = values[field];
        values[field] = newer.trim();
      }
    }

    // A won or lost lead that comes back is open again.
    const reopened = lead.status === "won" || lead.status === "lost";

    // The new message is added under a dated label, so the analysis can see how the customer's needs moved.
    const message = `${lead.message}\n\n[Enquired again on ${todayIST()} via ${source}]\n${incoming.message}`;

    const merged = await mergeIntoLead(id, {
      phone: lead.phone ?? (incoming.phone || null),
      email: lead.email ?? (incoming.email || null),
      ...values,
      message,
      status: reopened ? "new" : lead.status,
    });
    if (!merged) return fail("NOT_FOUND", "Lead not found.", 404);

    await addEvent(id, "merged", {
      source,
      message: incoming.message,
      previous,
      ...(reopened ? { reopened_from: lead.status, note: "re-enquired after closing" } : {}),
    });
    revalidatePath("/");

    try {
      return ok(await runAnalysis(merged));
    } catch (err) {
      if (err instanceof AiError) return ok(merged, err.code);
      throw err;
    }
  } catch (err) {
    return errorResponse(err);
  }
}
