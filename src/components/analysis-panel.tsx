// The "scan in 5 seconds" view of a lead: tier, summary and next action first, details below.

import { CopyButton } from "@/components/copy-button";
import { TierBadge } from "@/components/tier-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead, LeadAnalysis } from "@/types";

const SIGNAL_LABELS: { key: keyof LeadAnalysis["signals"]; label: string }[] = [
  { key: "intent_strength", label: "Intent strength" },
  { key: "budget_fit", label: "Budget fit" },
  { key: "timeline_urgency", label: "Timeline urgency" },
  { key: "engagement", label: "Engagement" },
];

const INTENT_LABELS: Record<LeadAnalysis["intent"], string> = {
  buy_to_live: "Buying to live in",
  investment: "Investment",
  rent: "Renting",
  just_browsing: "Just browsing",
  unclear: "Unclear",
};

// Four segments, filled up to the signal value (0 to 3).
function SignalBar({ value }: { value: number }) {
  return (
    <div className="flex gap-1" aria-label={`${value} out of 3`}>
      {[1, 2, 3].map((step) => (
        <div key={step} className={`h-2 w-10 rounded ${step <= value ? "bg-primary" : "bg-muted"}`} />
      ))}
    </div>
  );
}

// WhatsApp wants country code + number. Assume India for 10-digit numbers.
function whatsappLink(lead: Lead, text: string): string | null {
  if (!lead.phone_norm) return null;
  const number = lead.phone_norm.length === 10 ? `91${lead.phone_norm}` : lead.phone_norm;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function AnalysisPanel({ lead, analysis }: { lead: Lead; analysis: LeadAnalysis }) {
  const whatsapp = whatsappLink(lead, analysis.suggested_response);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{lead.name}</h1>
        <TierBadge tier={lead.tier} />
        <span className="text-lg font-medium">{lead.score ?? "-"}/100</span>
        <Badge variant="outline" className="capitalize">
          {lead.status}
        </Badge>
      </div>

      <p className="text-lg leading-relaxed">{analysis.summary}</p>

      <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">Next action</p>
        <p className="font-medium">{analysis.next_action}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key requirements</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.key_requirements.length === 0 && (
              <p className="text-sm text-muted-foreground">None stated.</p>
            )}
            {analysis.key_requirements.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Objections</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.objections.length === 0 ? (
              <p className="text-sm text-muted-foreground">None so far.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
                {analysis.objections.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intent: {INTENT_LABELS[analysis.intent]}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{analysis.intent_note}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why this score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SIGNAL_LABELS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{label}</span>
                <SignalBar value={analysis.signals[key].score} />
              </div>
              <p className="text-sm text-muted-foreground">{analysis.signals[key].reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested response ({analysis.language})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{analysis.suggested_response}</p>
          <div className="flex gap-2">
            <CopyButton text={analysis.suggested_response} />
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
              >
                Open in WhatsApp
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {analysis.red_flags.length > 0 && (
        <Card className="border-red-300 dark:border-red-900">
          <CardHeader>
            <CardTitle>Red flags</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-700 dark:text-red-400">
              {analysis.red_flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
