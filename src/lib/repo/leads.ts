// Lead queries. All SQL uses tagged templates, so values are always sent as parameters.

import { sql } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/duplicates";
import type { Lead, LeadAnalysis, LeadInput, LeadSource, LeadStatus, Tier } from "@/types";

export type LeadFilters = { tier?: Tier; status?: LeadStatus; q?: string };

// Timestamps come back from Neon as Date objects; the app uses ISO strings.
function iso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: (row.phone as string | null) ?? null,
    phone_norm: (row.phone_norm as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    location: row.location as string,
    property_req: row.property_req as string,
    budget_text: row.budget_text as string,
    timeline_text: row.timeline_text as string,
    message: row.message as string,
    source: row.source as LeadSource,
    status: row.status as LeadStatus,
    analysis: (row.analysis as LeadAnalysis | null) ?? null,
    score: (row.score as number | null) ?? null,
    tier: (row.tier as Tier | null) ?? null,
    next_follow_up_at: iso(row.next_follow_up_at),
    follow_up_reason: (row.follow_up_reason as string | null) ?? null,
    last_contacted_at: iso(row.last_contacted_at),
    created_at: iso(row.created_at) as string,
    updated_at: iso(row.updated_at) as string,
  };
}

export async function createLead(input: LeadInput, source: LeadSource): Promise<Lead> {
  const phone = input.phone?.trim() || null;
  const rows = await sql`
    insert into leads (name, phone, phone_norm, email, location, property_req, budget_text, timeline_text, message, source)
    values (${input.name}, ${phone}, ${normalizePhone(phone)}, ${normalizeEmail(input.email)}, ${input.location},
            ${input.property_req}, ${input.budget_text}, ${input.timeline_text}, ${input.message}, ${source})
    returning *`;
  return rowToLead(rows[0]);
}

export async function getLead(id: string): Promise<Lead | null> {
  const rows = await sql`select * from leads where id = ${id}`;
  return rows[0] ? rowToLead(rows[0]) : null;
}

// Sort order (ARCHITECTURE.md section 6): overdue follow-ups, then tier, then score, then newest.
export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const tier = filters.tier ?? null;
  const status = filters.status ?? null;
  const q = filters.q?.trim() || null;
  const rows = await sql`
    select * from leads
    where (${tier}::text is null or tier = ${tier})
      and (${status}::text is null or status = ${status})
      and (${q}::text is null
           or name ilike '%' || ${q} || '%'
           or location ilike '%' || ${q} || '%'
           or phone ilike '%' || ${q} || '%'
           or email ilike '%' || ${q} || '%')
    order by
      (next_follow_up_at is not null and next_follow_up_at < now() and status not in ('won', 'lost')) desc,
      case tier when 'hot' then 0 when 'warm' then 1 when 'cold' then 2 else 3 end,
      score desc nulls last,
      created_at desc`;
  return rows.map(rowToLead);
}

export async function updateLeadAnalysis(
  id: string,
  analysis: LeadAnalysis,
  score: number,
  tier: Tier,
): Promise<Lead | null> {
  const rows = await sql`
    update leads
    set analysis = ${JSON.stringify(analysis)}::jsonb, score = ${score}, tier = ${tier}, updated_at = now()
    where id = ${id}
    returning *`;
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
  const rows = await sql`
    update leads set status = ${status}, updated_at = now()
    where id = ${id}
    returning *`;
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function setFollowUp(
  id: string,
  at: Date | null,
  reason: string | null,
): Promise<Lead | null> {
  const rows = await sql`
    update leads
    set next_follow_up_at = ${at ? at.toISOString() : null}::timestamptz,
        follow_up_reason = ${reason},
        updated_at = now()
    where id = ${id}
    returning *`;
  return rows[0] ? rowToLead(rows[0]) : null;
}

// Exact-match candidates for duplicate detection (phone or email).
export async function findByPhoneOrEmail(
  phoneNorm: string | null,
  email: string | null,
): Promise<Lead[]> {
  const cleanEmail = normalizeEmail(email);
  if (!phoneNorm && !cleanEmail) return [];
  const rows = await sql`
    select * from leads
    where (${phoneNorm}::text is not null and phone_norm = ${phoneNorm})
       or (${cleanEmail}::text is not null and email = ${cleanEmail})`;
  return rows.map(rowToLead);
}

// Most recent leads, used for fuzzy name matching in code.
export async function findRecentForFuzzy(limit: number): Promise<Lead[]> {
  const rows = await sql`select * from leads order by created_at desc limit ${limit}`;
  return rows.map(rowToLead);
}
