// Builds today's briefing: due leads from code, one AI call to order them and write the text,
// cached per (IST date, hash of the due leads) so reloading the page costs nothing.

import { createHash } from "node:crypto";
import { AiError, generateJson } from "@/lib/ai/client";
import { buildBriefingPrompt } from "@/lib/ai/prompts";
import { MorningBriefingJsonSchema, MorningBriefingSchema } from "@/lib/ai/schemas";
import { todayIST, weekdayIST } from "@/lib/dates";
import { dueReasonText } from "@/lib/due";
import { getBriefing, saveBriefing } from "@/lib/repo/briefings";
import { listLatestDebriefs } from "@/lib/repo/events";
import { listDueLeads } from "@/lib/repo/leads";
import type { BriefingItem, BriefingResponse, DueLead } from "@/types";
import type { z } from "zod";

const MAX_ITEMS = 10;
const REFRESH_COOLDOWN_MS = 60_000;

type Briefing = z.infer<typeof MorningBriefingSchema>;

// Same leads with the same updated_at give the same hash, so any change to a due lead makes a new plan.
function hashDueLeads(items: DueLead[]): string {
  const text = items.map(({ lead }) => `${lead.id}:${lead.updated_at}`).join("|");
  return createHash("sha256").update(text).digest("hex");
}

// Keeps only real lead ids, in the AI's order, and adds any due lead the AI skipped at the end.
function cleanBriefing(ai: Briefing, items: DueLead[]): Briefing {
  const byId = new Map(items.map((item) => [item.lead.id, item]));
  const seen = new Set<string>();
  const kept = ai.items
    .filter((item) => byId.has(item.lead_id) && !seen.has(item.lead_id) && seen.add(item.lead_id))
    .sort((a, b) => a.order - b.order);

  const missing = items
    .filter((item) => !seen.has(item.lead.id))
    .map(({ lead, reason, days }) => ({
      lead_id: lead.id,
      order: 0,
      why_now: dueReasonText(reason, days),
      opening_line: "",
      draft_message: lead.analysis?.suggested_response ?? "",
    }));

  const all = [...kept, ...missing].map((item, index) => ({ ...item, order: index + 1 }));
  return { headline: ai.headline, items: all };
}

// Joins the text with the lead facts a card needs.
function toResponse(briefing: Briefing, items: DueLead[], total: number, aiFailed: boolean): BriefingResponse {
  const byId = new Map(items.map((item) => [item.lead.id, item]));
  const cards: BriefingItem[] = briefing.items.flatMap((item) => {
    const due = byId.get(item.lead_id);
    if (!due) return [];
    const { lead, reason, days } = due;
    return [
      {
        lead_id: lead.id,
        why_now: item.why_now,
        opening_line: item.opening_line,
        draft_message: item.draft_message,
        name: lead.name,
        tier: lead.tier,
        score: lead.score,
        phone_norm: lead.phone_norm,
        reason,
        days,
      },
    ];
  });
  return { headline: briefing.headline, items: cards, total_due: total, ai_failed: aiFailed };
}

// When the AI is down: the due list in code order, with plain-words reasons and no AI text.
function withoutAi(items: DueLead[], total: number): BriefingResponse {
  const noun = total === 1 ? "follow-up" : "follow-ups";
  const plain = cleanBriefing({ headline: `${total} ${noun} due. Start with ${items[0].lead.name}.`, items: [] }, items);
  return toResponse(plain, items, total, true);
}

export async function getTodayBriefing(refresh: boolean): Promise<BriefingResponse> {
  const now = new Date();
  const today = todayIST(now);
  const due = await listDueLeads(now);

  // Nothing due: no AI call.
  if (due.length === 0) {
    return { headline: "No follow-ups due. Work new leads.", items: [], total_due: 0, ai_failed: false };
  }

  const items = due.slice(0, MAX_ITEMS);
  const hash = hashDueLeads(items);

  // A saved plan is used unless the user asked to refresh. Even then, a plan made in the last minute is reused.
  const saved = await getBriefing(today, hash);
  if (saved && (!refresh || now.getTime() - Date.parse(saved.created_at) < REFRESH_COOLDOWN_MS)) {
    const parsed = MorningBriefingSchema.safeParse(saved.content);
    if (parsed.success) return toResponse(cleanBriefing(parsed.data, items), items, due.length, false);
  }

  try {
    const debriefs = await listLatestDebriefs(items.map((item) => item.lead.id));
    const { system, user } = buildBriefingPrompt(
      items.map(({ lead, reason, days }) => ({
        lead,
        whyDue: dueReasonText(reason, days),
        lastDebrief: debriefs.get(lead.id),
      })),
      today,
      weekdayIST(now),
    );
    const { data } = await generateJson({
      system,
      user,
      schema: MorningBriefingSchema,
      jsonSchema: MorningBriefingJsonSchema,
    });
    const briefing = cleanBriefing(data, items);
    await saveBriefing(today, hash, briefing);
    return toResponse(briefing, items, due.length, false);
  } catch (err) {
    if (err instanceof AiError) return withoutAi(items, due.length);
    throw err;
  }
}
