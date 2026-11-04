// Timeline of everything that happened to a lead, newest first, with an icon per event and the score after it.

import { ArrowLeftRight, FilePlus, GitMerge, Phone, Sparkles, type LucideIcon } from "lucide-react";
import { formatDayIST, formatRelativeIST } from "@/lib/dates";
import type { LeadEvent, LeadEventType } from "@/types";

const LABELS: Record<LeadEventType, string> = {
  created: "Lead created",
  analysis: "AI analysis run",
  merged: "Duplicate merged in",
  debrief: "Call debrief",
  status_change: "Status changed",
};

const ICONS: Record<LeadEventType, LucideIcon> = {
  created: FilePlus,
  analysis: Sparkles,
  merged: GitMerge,
  debrief: Phone,
  status_change: ArrowLeftRight,
};

const OUTCOME_LABELS: Record<string, string> = {
  interested: "interested",
  needs_time: "needs time",
  site_visit_booked: "site visit booked",
  not_interested: "not interested",
  no_answer: "no answer",
};

// "Status: new to contacted", read from the event payload { from, to }.
function statusChangeText(payload: unknown): string {
  const { from, to } = (payload ?? {}) as { from?: string; to?: string };
  return from && to ? `Status: ${from} to ${to}` : LABELS.status_change;
}

// "Came back via paste on 4 Nov: <message>", read from the event payload { source, message }.
function mergedText(event: LeadEvent): string {
  const { source, message } = (event.payload ?? {}) as { source?: string; message?: string };
  if (!message) return LABELS.merged;
  const snippet = message.length > 300 ? `${message.slice(0, 300)}...` : message;
  return `Came back via ${source ?? "form"} on ${formatDayIST(event.created_at)}: ${snippet}`;
}

// "Call debrief: site visit booked, score 62 -> 78", read from the event payload.
function debriefText(payload: unknown): string {
  const { outcome, old_score, new_score, pending } = (payload ?? {}) as {
    outcome?: string;
    old_score?: number | null;
    new_score?: number | null;
    pending?: boolean;
  };
  if (pending) return "Call notes saved, not processed yet";
  const parts = [outcome ? (OUTCOME_LABELS[outcome] ?? outcome) : null];
  if (typeof new_score === "number") {
    parts.push(old_score === null || old_score === undefined || old_score === new_score
      ? `score ${new_score}`
      : `score ${old_score} -> ${new_score}`);
  }
  return `${LABELS.debrief}: ${parts.filter(Boolean).join(", ")}`;
}

function eventText(event: LeadEvent): string {
  if (event.type === "status_change") return statusChangeText(event.payload);
  if (event.type === "merged") return mergedText(event);
  if (event.type === "debrief") return debriefText(event.payload);
  return LABELS[event.type];
}

export function Timeline({ events }: { events: LeadEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>;

  return (
    <ol className="space-y-2">
      {events.map((event) => {
        const Icon = ICONS[event.type];
        // Debrief and status text already say the score, so only the other events get the "(score N)" suffix.
        const showScore = event.score !== null && event.type !== "debrief";
        return (
          <li key={event.id} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="flex items-baseline gap-2">
              <Icon className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" aria-hidden />
              <span>
                {eventText(event)}
                {showScore && <span className="text-muted-foreground"> (score {event.score})</span>}
              </span>
            </span>
            <span className="shrink-0 text-muted-foreground">{formatRelativeIST(event.created_at)}</span>
          </li>
        );
      })}
    </ol>
  );
}
