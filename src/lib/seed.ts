// Resets the demo workspace: deletes everything, then inserts the demo leads with their timelines.
// No AI calls: the analyses come from seed-analyses.json and the scores are computed in code as usual.

import { randomUUID } from "node:crypto";
import { LeadAnalysisSchema } from "@/lib/ai/schemas";
import { followUpAtIST, todayIST } from "@/lib/dates";
import { sql } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/duplicates";
import { computeScore, tierFor } from "@/lib/scoring";
import analysesJson from "@/lib/seed-analyses.json";
import { SEED_LEADS, leadAfterMerge, type SeedDebrief, type SignalKey } from "@/lib/seed-data";
import type { LeadAnalysis, LeadEventType, LeadInput, LeadStatus, Tier } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type LeadRow = {
  id: string;
  input: LeadInput;
  status: LeadStatus;
  analysis: LeadAnalysis;
  score: number;
  tier: Tier;
  followUpAt: Date | null;
  followUpReason: string | null;
  lastContactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventRow = { leadId: string; type: LeadEventType; payload: unknown; score: number | null; createdAt: Date };

// A saved analysis, checked against the same Zod schema the app uses, so a schema change cannot slip through.
function savedAnalysis(key: string): LeadAnalysis {
  const found = (analysesJson as Record<string, unknown>)[key];
  if (!found) throw new Error(`No saved analysis for "${key}". Run: npm run seed:gen`);
  return LeadAnalysisSchema.parse(found);
}

// What a logged call does to the analysis: signals move (inside 0 to 3) and new objections are added.
function applyDebrief(analysis: LeadAnalysis, debrief: SeedDebrief): LeadAnalysis {
  const signals = { ...analysis.signals };
  for (const key of Object.keys(debrief.signalChanges) as SignalKey[]) {
    const signal = signals[key];
    const score = Math.min(3, Math.max(0, signal.score + (debrief.signalChanges[key] ?? 0)));
    signals[key] = { score, reason: `${signal.reason} (Updated after a call.)` };
  }
  return { ...analysis, signals, objections: [...analysis.objections, ...debrief.newObjections].slice(0, 5) };
}

// Turns SEED_LEADS into rows, with every date counted back from `now`.
export function buildSeed(now: Date): { leads: LeadRow[]; events: EventRow[] } {
  const ago = (days: number, hours = 0) => new Date(now.getTime() - days * DAY_MS - hours * HOUR_MS);
  const leads: LeadRow[] = [];
  const events: EventRow[] = [];

  SEED_LEADS.forEach((seed, index) => {
    const id = randomUUID();
    const createdAt = ago(seed.createdDaysAgo, index); // the index spreads same-day leads apart
    const log = (type: LeadEventType, payload: unknown, score: number | null, at: Date) =>
      events.push({ leadId: id, type, payload, score, createdAt: at });
    const scoreOf = (a: LeadAnalysis) => computeScore(a.signals, a.red_flags);

    log("created", { source: "seed" }, null, createdAt);

    // First analysis, then (for a merged lead) the repeat enquiry and the analysis that followed it.
    let analysis = savedAnalysis(seed.merge ? `${seed.input.name}#before` : seed.input.name);
    log("analysis", analysis, scoreOf(analysis), new Date(createdAt.getTime() + 60_000));

    let input = seed.input;
    if (seed.merge) {
      const mergedAt = ago(seed.merge.daysAgo);
      input = leadAfterMerge(seed, todayIST(mergedAt));
      log(
        "merged",
        {
          source: seed.merge.source,
          message: seed.merge.newMessage,
          previous: { budget_text: seed.input.budget_text, timeline_text: seed.input.timeline_text },
        },
        null,
        mergedAt,
      );
      analysis = savedAnalysis(seed.input.name);
      log("analysis", analysis, scoreOf(analysis), new Date(mergedAt.getTime() + 60_000));
    }

    for (const debrief of seed.debriefs ?? []) {
      const next = applyDebrief(analysis, debrief);
      const at = ago(debrief.daysAgo);
      log(
        "debrief",
        {
          notes: debrief.notes,
          outcome: debrief.outcome,
          old_score: scoreOf(analysis),
          new_score: scoreOf(next),
          old_tier: tierFor(scoreOf(analysis)),
          new_tier: tierFor(scoreOf(next)),
          new_objections: debrief.newObjections,
          follow_up_at: new Date(at.getTime() + debrief.followUpDays * DAY_MS).toISOString(),
          follow_up_reason:
            debrief.outcome === "site_visit_booked" ? "Ask how the site visit went" : "Check in after the call",
          follow_up_message: debrief.followUpMessage,
        },
        scoreOf(next),
        at,
      );
      analysis = next;
    }

    const score = scoreOf(analysis);
    if (seed.status !== "new") {
      log("status_change", { from: "new", to: seed.status }, score, ago(seed.contactedDaysAgo ?? seed.createdDaysAgo));
    }

    const lastEventAt = Math.max(...events.filter((e) => e.leadId === id).map((e) => e.createdAt.getTime()));
    leads.push({
      id,
      input,
      status: seed.status,
      analysis,
      score,
      tier: tierFor(score),
      followUpAt: seed.followUpInDays === undefined ? null : followUpAtIST(seed.followUpInDays, now),
      followUpReason: seed.followUpReason ?? null,
      lastContactedAt: seed.contactedDaysAgo === undefined ? null : ago(seed.contactedDaysAgo),
      createdAt,
      updatedAt: new Date(lastEventAt),
    });
  });

  return { leads, events };
}

// Deletes everything and inserts the demo leads in one transaction, so a failure never leaves an empty database.
export async function resetDemoData(now: Date = new Date()): Promise<number> {
  const { leads, events } = buildSeed(now);
  const iso = (date: Date | null) => (date ? date.toISOString() : null);

  await sql.transaction([
    sql`delete from briefings`,
    sql`delete from leads`, // events and chat messages are deleted with their lead
    ...leads.map(
      (l) => sql`
        insert into leads (id, name, phone, phone_norm, email, location, property_req, budget_text, timeline_text,
                           message, source, status, analysis, score, tier, next_follow_up_at, follow_up_reason,
                           last_contacted_at, created_at, updated_at)
        values (${l.id}, ${l.input.name}, ${l.input.phone ?? null}, ${normalizePhone(l.input.phone)},
                ${normalizeEmail(l.input.email)}, ${l.input.location}, ${l.input.property_req},
                ${l.input.budget_text}, ${l.input.timeline_text}, ${l.input.message}, 'seed', ${l.status},
                ${JSON.stringify(l.analysis)}::jsonb, ${l.score}, ${l.tier}, ${iso(l.followUpAt)}::timestamptz,
                ${l.followUpReason}, ${iso(l.lastContactedAt)}::timestamptz, ${iso(l.createdAt)}::timestamptz,
                ${iso(l.updatedAt)}::timestamptz)`,
    ),
    ...events.map(
      (e) => sql`
        insert into lead_events (lead_id, type, payload, score, created_at)
        values (${e.leadId}, ${e.type}, ${JSON.stringify(e.payload)}::jsonb, ${e.score}, ${iso(e.createdAt)}::timestamptz)`,
    ),
  ]);
  return leads.length;
}

// Seeds only when the demo is enabled and there are no leads at all (first visit to a fresh database).
export async function ensureDemoData(): Promise<void> {
  if (process.env.DEMO_RESET_ENABLED !== "true") return;
  const rows = await sql`select count(*)::int as n from leads`;
  if (rows[0].n === 0) await resetDemoData();
}
