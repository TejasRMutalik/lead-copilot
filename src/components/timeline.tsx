// Timeline of everything that happened to a lead, newest first, with the score after each event.

import { formatRelativeIST } from "@/lib/dates";
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

export function Timeline({ events }: { events: LeadEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>;

  return (
    <ol className="space-y-2">
      {events.map((event) => (
        <li key={event.id} className="flex items-baseline justify-between gap-4 text-sm">
          <span>
            {event.type === "status_change" ? statusChangeText(event.payload) : LABELS[event.type]}
            {event.score !== null && <span className="text-muted-foreground"> (score {event.score})</span>}
          </span>
          <span className="text-muted-foreground">{formatRelativeIST(event.created_at)}</span>
        </li>
      ))}
    </ol>
  );
}
