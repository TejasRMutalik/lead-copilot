// Timeline of everything that happened to a lead, newest first, with the score after each event.

import { formatDayIST, formatRelativeIST } from "@/lib/dates";
import type { LeadEvent, LeadEventType } from "@/types";

const LABELS: Record<LeadEventType, string> = {
  created: "Lead created",
  analysis: "AI analysis run",
  merged: "Duplicate merged in",
  debrief: "Call debrief",
  status_change: "Status changed",
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

export function Timeline({ events }: { events: LeadEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>;

  return (
    <ol className="space-y-2">
      {events.map((event) => (
        <li key={event.id} className="flex items-baseline justify-between gap-4 text-sm">
          <span>
            {event.type === "status_change"
              ? statusChangeText(event.payload)
              : event.type === "merged"
                ? mergedText(event)
                : LABELS[event.type]}
            {event.score !== null && <span className="text-muted-foreground"> (score {event.score})</span>}
          </span>
          <span className="text-muted-foreground">{formatRelativeIST(event.created_at)}</span>
        </li>
      ))}
    </ol>
  );
}
