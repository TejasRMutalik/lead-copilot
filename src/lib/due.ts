// Decides which leads are "due" for the morning briefing and how to describe them. Pure code, no database.

import { dayDiffIST } from "@/lib/dates";
import type { DueLead, DueReason, Lead } from "@/types";

const COLD_AFTER_DAYS = { hot: 3, warm: 7 }; // no contact for this many days = going cold

// Lower comes first in the briefing.
export const REASON_RANK: Record<DueReason, number> = { overdue: 0, due_today: 1, going_cold: 2, new_hot: 3 };

// Returns why the lead is due today, or null if it is not due. All day counts are IST calendar days.
export function classifyDue(lead: Lead, now: Date = new Date()): { reason: DueReason; days: number } | null {
  if (lead.status === "won" || lead.status === "lost") return null;

  if (lead.next_follow_up_at) {
    const diff = dayDiffIST(lead.next_follow_up_at, now);
    if (diff < 0) return { reason: "overdue", days: -diff };
    if (diff === 0) return { reason: "due_today", days: 0 };
    return null; // a future follow-up is already planned
  }

  if (lead.tier !== "hot" && lead.tier !== "warm") return null;
  const lastContact = lead.last_contacted_at ?? lead.created_at;
  const daysSince = Math.max(0, -dayDiffIST(lastContact, now));
  if (daysSince >= COLD_AFTER_DAYS[lead.tier]) return { reason: "going_cold", days: daysSince };
  if (lead.tier === "hot" && lead.last_contacted_at === null) return { reason: "new_hot", days: daysSince };
  return null;
}

const TIER_RANK = { hot: 0, warm: 1, cold: 2 };

// Overdue first (longest overdue first), then due today, going cold, new hot; ties by tier, then score.
export function compareDue(a: DueLead, b: DueLead): number {
  return (
    REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
    (a.reason === "overdue" ? b.days - a.days : 0) ||
    (a.lead.tier ? TIER_RANK[a.lead.tier] : 3) - (b.lead.tier ? TIER_RANK[b.lead.tier] : 3) ||
    (b.lead.score ?? 0) - (a.lead.score ?? 0)
  );
}

// Short chip text, e.g. "Overdue 2d".
export function dueChipText(reason: DueReason, days: number): string {
  if (reason === "overdue") return `Overdue ${days}d`;
  if (reason === "due_today") return "Due today";
  if (reason === "going_cold") return "Going cold";
  return "New hot lead";
}

// One-line reason in plain words. Used when the AI text is missing.
export function dueReasonText(reason: DueReason, days: number): string {
  if (reason === "overdue") return `Follow-up is ${days} day${days === 1 ? "" : "s"} overdue.`;
  if (reason === "due_today") return "Follow-up is due today.";
  if (reason === "going_cold") return `No contact for ${days} days, so this lead is going cold.`;
  return "New hot lead that has not been contacted yet.";
}
