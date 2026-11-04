// What to do with this lead, in the order a salesperson needs it: next action, reply to send, then the reasoning.

import { ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { whatsappUrl } from "@/lib/whatsapp";
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

// Three segments, filled up to the signal value (0 to 3).
function SignalBar({ value }: { value: number }) {
  return (
    <div className="flex gap-1" aria-label={`${value} out of 3`}>
      {[1, 2, 3].map((step) => (
        <div key={step} className={`h-2 w-10 rounded ${step <= value ? "bg-primary" : "bg-muted"}`} />
      ))}
    </div>
  );
}

// A section that starts closed and opens on click. Plain <details>, so it works without JavaScript.
function Collapsible({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
        {title}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </summary>
      <div className="border-t px-4 py-3">{children}</div>
    </details>
  );
}

export function AnalysisPanel({ lead, analysis }: { lead: Lead; analysis: LeadAnalysis }) {
  const whatsapp = whatsappUrl(lead.phone_norm, analysis.suggested_response);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next action</p>
        <p className="mt-1 text-lg font-semibold leading-snug">{analysis.next_action}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggested reply ({analysis.language})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm leading-relaxed">
            {analysis.suggested_response}
          </p>
          <div className="flex flex-wrap gap-2">
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

      <p className="text-base leading-relaxed text-muted-foreground">{analysis.summary}</p>

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

      <div className="space-y-2">
        <Collapsible title="Why this score" hint={`${lead.score ?? "-"}/100`}>
          <div className="space-y-3">
            {SIGNAL_LABELS.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{label}</span>
                  <SignalBar value={analysis.signals[key].score} />
                </div>
                <p className="text-sm text-muted-foreground">{analysis.signals[key].reason}</p>
              </div>
            ))}
          </div>
        </Collapsible>
        <Collapsible title="Intent" hint={INTENT_LABELS[analysis.intent]}>
          <p className="text-sm text-muted-foreground">{analysis.intent_note}</p>
        </Collapsible>
        <Collapsible title="Customer's message">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lead.message}</p>
        </Collapsible>
      </div>
    </div>
  );
}
