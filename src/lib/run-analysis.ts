// Runs the AI analysis for a saved lead, stores the result and logs it on the timeline.

import { analyzeLead } from "@/lib/ai/analyze";
import { addEvent } from "@/lib/repo/events";
import { updateLeadAnalysis } from "@/lib/repo/leads";
import type { Lead } from "@/types";

// Throws AiError if the AI fails. The caller decides how to report that.
export async function runAnalysis(lead: Lead): Promise<Lead> {
  const { analysis, score, tier } = await analyzeLead(lead);
  const updated = await updateLeadAnalysis(lead.id, analysis, score, tier);
  await addEvent(lead.id, "analysis", analysis, score);
  return updated ?? lead;
}
