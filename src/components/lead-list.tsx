// The ranked lead list: Overdue first, then Hot, Warm, Cold, Not analyzed, and a collapsed Closed section.

import { LeadCard } from "@/components/lead-card";
import { dayDiffIST } from "@/lib/dates";
import type { Lead } from "@/types";

function isClosed(lead: Lead) {
  return lead.status === "won" || lead.status === "lost";
}

// Overdue = follow-up on an earlier IST day. Same rule as the SQL sort in listLeads.
function isOverdue(lead: Lead) {
  return !isClosed(lead) && lead.next_follow_up_at !== null && dayDiffIST(lead.next_follow_up_at) < 0;
}

function Section({ title, leads }: { title: string; leads: Lead[] }) {
  if (leads.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">
        {title} ({leads.length})
      </h2>
      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </section>
  );
}

// `leads` arrive already sorted by the database, so each group keeps that order.
export function LeadList({ leads, filtered }: { leads: Lead[]; filtered: boolean }) {
  if (leads.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        {filtered ? "No leads match your filters." : "No leads yet. Add your first lead to get started."}
      </p>
    );
  }

  const open = leads.filter((lead) => !isClosed(lead));
  const overdue = open.filter(isOverdue);
  const rest = open.filter((lead) => !isOverdue(lead));
  const closed = leads.filter(isClosed);

  return (
    <div className="space-y-6">
      <Section title="Overdue follow-ups" leads={overdue} />
      <Section title="Hot" leads={rest.filter((lead) => lead.analysis && lead.tier === "hot")} />
      <Section title="Warm" leads={rest.filter((lead) => lead.analysis && lead.tier === "warm")} />
      <Section title="Cold" leads={rest.filter((lead) => lead.analysis && lead.tier === "cold")} />
      <Section title="Not analyzed" leads={rest.filter((lead) => !lead.analysis)} />
      {closed.length > 0 && (
        <details className="space-y-2">
          <summary className="cursor-pointer text-sm font-semibold uppercase text-muted-foreground">
            Closed ({closed.length})
          </summary>
          <div className="mt-2 space-y-2">
            {closed.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
