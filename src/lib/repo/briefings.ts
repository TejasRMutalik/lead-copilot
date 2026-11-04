// Briefing cache: one row per (IST date, hash of due leads), so refreshing the page costs no AI quota.

import { sql } from "@/lib/db";
import type { BriefingRecord } from "@/types";

function rowToBriefing(row: Record<string, unknown>): BriefingRecord {
  const createdAt = row.created_at;
  return {
    id: row.id as string,
    date_ist: row.date_ist as string,
    leads_hash: row.leads_hash as string,
    content: row.content,
    created_at: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
  };
}

export async function getBriefing(dateIST: string, hash: string): Promise<BriefingRecord | null> {
  const rows = await sql`
    select id, date_ist::text as date_ist, leads_hash, content, created_at
    from briefings
    where date_ist = ${dateIST}::date and leads_hash = ${hash}`;
  return rows[0] ? rowToBriefing(rows[0]) : null;
}

// If the same (date, hash) is saved twice, the first one wins.
export async function saveBriefing(
  dateIST: string,
  hash: string,
  content: unknown,
): Promise<BriefingRecord> {
  const rows = await sql`
    insert into briefings (date_ist, leads_hash, content)
    values (${dateIST}::date, ${hash}, ${JSON.stringify(content)}::jsonb)
    on conflict (date_ist, leads_hash) do update set leads_hash = excluded.leads_hash
    returning id, date_ist::text as date_ist, leads_hash, content, created_at`;
  return rowToBriefing(rows[0]);
}
