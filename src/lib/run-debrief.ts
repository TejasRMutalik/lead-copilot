// Turns call notes into lead updates: runDebrief (AI reads the notes) and runNoAnswer (no AI call at all).
// Both change the lead, add a "debrief" event with the score before and after, and return a summary for the card.

import { generateJson } from "@/lib/ai/client";
import { buildDebriefPrompt } from "@/lib/ai/prompts";
import { DebriefResultJsonSchema, DebriefResultSchema } from "@/lib/ai/schemas";
import { followUpAtIST, todayIST, weekdayIST } from "@/lib/dates";
import { addEvent, updateEventPayload } from "@/lib/repo/events";
import { applyDebrief } from "@/lib/repo/leads";
import { computeScore, tierFor } from "@/lib/scoring";
import type { DebriefSummary, Lead, LeadEvent } from "@/types";

const NO_ANSWER_STREAK = 3; // this many missed calls in a row lowers the engagement signal

type DebriefPayload = { notes?: string; outcome?: string; pending?: boolean };

function debriefEvents(events: LeadEvent[]): { event: LeadEvent; payload: DebriefPayload }[] {
  return events
    .filter((event) => event.type === "debrief")
    .map((event) => ({ event, payload: (event.payload ?? {}) as DebriefPayload }));
}

export async function runDebrief(
  lead: Lead,
  events: LeadEvent[],
  notes: string,
): Promise<{ lead: Lead; summary: DebriefSummary }> {
  // Save the notes first, so they are not lost if the AI fails. A retry reuses the saved entry.
  const earlier = debriefEvents(events).find((d) => d.payload.pending && d.payload.notes === notes);
  const saved = earlier?.event ?? (await addEvent(lead.id, "debrief", { notes, pending: true }, lead.score));

  const now = new Date();
  const { system, user } = buildDebriefPrompt(lead, notes, events, todayIST(now), weekdayIST(now));
  const { data: result } = await generateJson({
    system,
    user,
    schema: DebriefResultSchema,
    jsonSchema: DebriefResultJsonSchema,
  });

  const analysis = result.updated_analysis;
  const score = computeScore(analysis.signals, analysis.red_flags);
  const tier = tierFor(score);

  // Never reopen or close a lead the user already marked won or lost.
  const closed = lead.status === "won" || lead.status === "lost";
  const status = closed ? lead.status : result.suggested_status;

  // "Not interested" with no reason to call back means no follow-up. Days are clamped to 0..30 again here.
  const noFollowUp = result.call_outcome === "not_interested" && result.follow_up_in_days === 0;
  const days = Math.min(30, Math.max(0, result.follow_up_in_days));
  const followUpAt = noFollowUp ? null : followUpAtIST(days, now);
  const followUpReason = noFollowUp ? null : result.follow_up_reason || null;

  const updated = await applyDebrief(lead.id, {
    analysis,
    score,
    tier,
    status,
    markContacted: result.call_outcome !== "no_answer",
    followUpAt,
    followUpReason,
  });
  if (!updated) throw new Error("lead disappeared during debrief");

  await updateEventPayload(
    saved.id,
    {
      notes,
      outcome: result.call_outcome,
      old_score: lead.score,
      new_score: score,
      old_tier: lead.tier,
      new_tier: tier,
      new_objections: result.new_objections,
      follow_up_at: followUpAt?.toISOString() ?? null,
      follow_up_reason: followUpReason,
      follow_up_message: result.follow_up_message,
    },
    score,
  );
  if (status !== lead.status) await addEvent(lead.id, "status_change", { from: lead.status, to: status }, score);

  return {
    lead: updated,
    summary: {
      call_outcome: result.call_outcome,
      old_score: lead.score,
      new_score: score,
      new_tier: tier,
      new_objections: result.new_objections,
      follow_up_at: followUpAt?.toISOString() ?? null,
      follow_up_reason: followUpReason,
      follow_up_message: result.follow_up_message,
      note: null,
    },
  };
}

export async function runNoAnswer(
  lead: Lead,
  events: LeadEvent[],
): Promise<{ lead: Lead; summary: DebriefSummary }> {
  // Events are newest first. Count the missed calls in a row, ignoring notes the AI never processed.
  let streak = 1; // this call
  for (const { payload } of debriefEvents(events).filter((d) => !d.payload.pending)) {
    if (payload.outcome !== "no_answer") break;
    streak++;
  }

  let analysis = lead.analysis;
  let score = lead.score;
  let tier = lead.tier;
  let note: string | null = null;
  if (analysis && streak % NO_ANSWER_STREAK === 0) {
    const engagement = analysis.signals.engagement;
    analysis = {
      ...analysis,
      signals: {
        ...analysis.signals,
        engagement: {
          score: Math.max(0, engagement.score - 1),
          reason: `${engagement.reason} (Lowered because the customer did not answer ${streak} calls in a row.)`,
        },
      },
    };
    score = computeScore(analysis.signals, analysis.red_flags);
    tier = tierFor(score);
    note = `Engagement lowered: no answer on ${streak} calls in a row.`;
  }

  const followUpAt = followUpAtIST(1);
  const followUpReason = "No answer on the last call, try again tomorrow";
  const updated = await applyDebrief(lead.id, {
    analysis,
    score,
    tier,
    status: lead.status,
    markContacted: false,
    followUpAt,
    followUpReason,
  });
  if (!updated) throw new Error("lead disappeared during debrief");

  await addEvent(
    lead.id,
    "debrief",
    {
      outcome: "no_answer",
      streak,
      old_score: lead.score,
      new_score: score,
      old_tier: lead.tier,
      new_tier: tier,
      follow_up_at: followUpAt.toISOString(),
      follow_up_reason: followUpReason,
    },
    score,
  );

  return {
    lead: updated,
    summary: {
      call_outcome: "no_answer",
      old_score: lead.score,
      new_score: score,
      new_tier: tier,
      new_objections: [],
      follow_up_at: followUpAt.toISOString(),
      follow_up_reason: followUpReason,
      follow_up_message: null,
      note,
    },
  };
}
