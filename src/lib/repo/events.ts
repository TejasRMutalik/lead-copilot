// Timeline queries: lead_events holds created, analysis, merged, debrief and status_change entries.

import { sql } from "@/lib/db";
import type { LeadEvent, LeadEventType } from "@/types";

function rowToEvent(row: Record<string, unknown>): LeadEvent {
  const createdAt = row.created_at;
  return {
    id: row.id as string,
    lead_id: row.lead_id as string,
    type: row.type as LeadEventType,
    payload: row.payload ?? null,
    score: (row.score as number | null) ?? null,
    created_at: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
  };
}

export async function addEvent(
  leadId: string,
  type: LeadEventType,
  payload: unknown,
  score: number | null = null,
): Promise<LeadEvent> {
  const rows = await sql`
    insert into lead_events (lead_id, type, payload, score)
    values (${leadId}, ${type}, ${JSON.stringify(payload ?? null)}::jsonb, ${score})
    returning *`;
  return rowToEvent(rows[0]);
}

// Newest first.
export async function listEvents(leadId: string): Promise<LeadEvent[]> {
  const rows = await sql`
    select * from lead_events where lead_id = ${leadId} order by created_at desc`;
  return rows.map(rowToEvent);
}

// Replaces the payload (and score) of an event. Used to fill in a debrief that was saved before the AI ran.
export async function updateEventPayload(id: string, payload: unknown, score: number | null): Promise<void> {
  await sql`update lead_events set payload = ${JSON.stringify(payload ?? null)}::jsonb, score = ${score} where id = ${id}`;
}

// The most recent debrief event for each of the given leads (used to brief the AI on the last call).
export async function listLatestDebriefs(leadIds: string[]): Promise<Map<string, LeadEvent>> {
  if (leadIds.length === 0) return new Map();
  const rows = await sql`
    select distinct on (lead_id) * from lead_events
    where type = 'debrief' and lead_id = any(${leadIds}::uuid[])
    order by lead_id, created_at desc`;
  return new Map(rows.map((row) => [row.lead_id as string, rowToEvent(row)]));
}
