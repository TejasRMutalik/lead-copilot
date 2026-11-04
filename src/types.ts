// Shared types for leads, events, chat and AI analysis. Shapes follow ARCHITECTURE.md sections 4 and 5.

export type Tier = "hot" | "warm" | "cold";
export type LeadStatus = "new" | "contacted" | "negotiating" | "won" | "lost";
export type LeadSource = "form" | "paste" | "seed";
export type Intent = "buy_to_live" | "investment" | "rent" | "just_browsing" | "unclear";

// score is 0..3; Zod enforces the range and scoring.ts clamps it again.
export type Signal = { score: number; reason: string };

export type LeadAnalysis = {
  summary: string;
  intent: Intent;
  intent_note: string;
  key_requirements: string[];
  objections: string[];
  next_action: string;
  suggested_response: string;
  signals: {
    intent_strength: Signal;
    budget_fit: Signal;
    timeline_urgency: Signal;
    engagement: Signal;
  };
  red_flags: string[];
  language: string;
};

// What the user (or the paste parser) provides to create a lead.
export type LeadInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  location: string;
  property_req: string;
  budget_text: string;
  timeline_text: string;
  message: string;
};

// Timestamps are ISO strings so they can cross the server/client boundary.
export type Lead = LeadInput & {
  id: string;
  phone_norm: string | null;
  source: LeadSource;
  status: LeadStatus;
  analysis: LeadAnalysis | null;
  score: number | null;
  tier: Tier | null;
  next_follow_up_at: string | null;
  follow_up_reason: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadEventType = "created" | "analysis" | "merged" | "debrief" | "status_change";

export type LeadEvent = {
  id: string;
  lead_id: string;
  type: LeadEventType;
  payload: unknown;
  score: number | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  lead_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type BriefingRecord = {
  id: string;
  date_ist: string;
  leads_hash: string;
  content: unknown;
  created_at: string;
};

// A possible existing lead for a new enquiry. `reason` is shown in the duplicate dialog.
export type DuplicateCandidate = {
  lead: Lead;
  matchType: "phone" | "email" | "ai";
  confidence: number;
  reason: string;
};

// What the debrief card shows after a call. Scores are before and after the debrief.
export type DebriefSummary = {
  call_outcome: "interested" | "needs_time" | "site_visit_booked" | "not_interested" | "no_answer";
  old_score: number | null;
  new_score: number | null;
  new_tier: Tier | null;
  new_objections: string[];
  follow_up_at: string | null;
  follow_up_reason: string | null;
  follow_up_message: string | null;
  note: string | null; // extra explanation, e.g. engagement lowered after 3 missed calls
};

// Why a lead shows up in the morning briefing.
export type DueReason = "overdue" | "due_today" | "going_cold" | "new_hot";

export type DueLead = { lead: Lead; reason: DueReason; days: number };

// One card in the Today panel: the AI text plus the lead facts the card needs.
export type BriefingItem = {
  lead_id: string;
  why_now: string;
  opening_line: string;
  draft_message: string;
  name: string;
  tier: Tier | null;
  score: number | null;
  phone_norm: string | null;
  reason: DueReason;
  days: number;
};

export type BriefingResponse = {
  headline: string;
  items: BriefingItem[];
  total_due: number; // can be more than items.length, because the plan is capped
  ai_failed: boolean; // true when the list is shown without AI text
};
