// Turns the AI's four signals into a 0-100 score and a tier. Pure code: the model never sets the number.

import type { LeadAnalysis, Tier } from "@/types";

// Second guard after Zod: keep every signal inside 0..3.
function clampSignal(value: number): number {
  return Math.min(3, Math.max(0, value));
}

export function computeScore(signals: LeadAnalysis["signals"], redFlags: string[]): number {
  const raw =
    (clampSignal(signals.intent_strength.score) / 3) * 30 +
    (clampSignal(signals.timeline_urgency.score) / 3) * 30 +
    (clampSignal(signals.budget_fit.score) / 3) * 25 +
    (clampSignal(signals.engagement.score) / 3) * 15;
  const penalty = redFlags.length >= 2 ? 10 : 0;
  return Math.max(0, Math.round(raw) - penalty);
}

export function tierFor(score: number): Tier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}
