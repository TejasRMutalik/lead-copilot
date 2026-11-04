// Browser-side helpers that call the save and merge routes and turn the response into a simple result.
// Used by the lead form and the paste queue, so both handle duplicates the same way.

import type { DuplicateCandidate, Lead, LeadInput } from "@/types";

export type SaveResult =
  | { kind: "saved"; lead: Lead; warning?: string } // warning is set when the lead saved but the AI analysis failed
  | { kind: "duplicates"; candidates: DuplicateCandidate[] } // nothing was saved yet
  | { kind: "error"; message: string };

async function send(url: string, body: unknown): Promise<SaveResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) return { kind: "error", message: json.error?.message ?? "Could not save the lead." };
    if (json.data.duplicateCandidates) return { kind: "duplicates", candidates: json.data.duplicateCandidates };
    return { kind: "saved", lead: json.data, warning: json.warning };
  } catch {
    return { kind: "error", message: "Could not reach the server. Please try again." };
  }
}

export function postLead(fields: LeadInput, source: "form" | "paste", skipDuplicateCheck = false) {
  return send("/api/leads", { ...fields, source, skipDuplicateCheck });
}

export function mergeLead(leadId: string, fields: LeadInput, source: "form" | "paste") {
  return send(`/api/leads/${leadId}/merge`, { ...fields, source });
}
