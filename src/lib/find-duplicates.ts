// Finds existing leads that may be the same person as a new enquiry.
// Order: exact phone, exact email, then similar name + same area/property confirmed by the AI.

import { judgeDuplicate } from "@/lib/ai/judge-duplicate";
import { nameSimilarity, normalizePhone, overlappingProperty, sameLocation } from "@/lib/duplicates";
import { findByPhoneOrEmail, findRecentForFuzzy } from "@/lib/repo/leads";
import type { DuplicateCandidate, LeadInput } from "@/types";

const FUZZY_POOL = 300; // how many recent leads to compare names against
const NAME_THRESHOLD = 0.8;
const MAX_AI_CHECKS = 3;
const AI_MIN_CONFIDENCE = 0.7;

export async function findDuplicates(input: LeadInput): Promise<DuplicateCandidate[]> {
  // 1 and 2: same phone or same email is a strong match, so stop here.
  const phoneNorm = normalizePhone(input.phone);
  const exact = await findByPhoneOrEmail(phoneNorm, input.email ?? null);
  if (exact.length > 0) {
    return exact.map((lead) => {
      const byPhone = phoneNorm !== null && lead.phone_norm === phoneNorm;
      return {
        lead,
        matchType: byPhone ? "phone" : "email",
        confidence: 1,
        reason: byPhone ? "Same phone number" : "Same email address",
      };
    });
  }

  // 3: similar name, and the same area or an overlapping property requirement.
  const recent = await findRecentForFuzzy(FUZZY_POOL);
  const possible = recent
    .map((lead) => ({ lead, similarity: nameSimilarity(input.name, lead.name) }))
    .filter(
      ({ lead, similarity }) =>
        similarity >= NAME_THRESHOLD &&
        (sameLocation(input.location, lead.location) || overlappingProperty(input.property_req, lead.property_req)),
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_AI_CHECKS);

  // 4: the AI makes the final call, one pair at a time. If it fails, that pair is skipped.
  const found: DuplicateCandidate[] = [];
  for (const { lead } of possible) {
    try {
      const judgement = await judgeDuplicate(input, lead);
      if (judgement.is_same_person && judgement.confidence >= AI_MIN_CONFIDENCE) {
        found.push({ lead, matchType: "ai", confidence: judgement.confidence, reason: judgement.reason });
      }
    } catch (err) {
      console.warn("[duplicates] AI check skipped", err instanceof Error ? err.message : err);
    }
  }
  return found;
}
