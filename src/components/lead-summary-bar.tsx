// Top of the lead page: who the lead is, how hot, status and follow-up. Stays visible while scrolling on wide screens.

import { FollowUpChip } from "@/components/follow-up-chip";
import { StatusSelect } from "@/components/status-select";
import { TierBadge } from "@/components/tier-badge";
import { formatDayIST, formatRelativeIST } from "@/lib/dates";
import type { Lead } from "@/types";

export function LeadSummaryBar({ lead }: { lead: Lead }) {
  const open = lead.status !== "won" && lead.status !== "lost";

  return (
    <div className="-mx-6 border-b bg-background px-6 py-3 md:sticky md:top-0 md:z-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-semibold">{lead.name}</h1>
        <TierBadge tier={lead.tier} />
        {lead.score !== null && (
          <span className="text-lg font-semibold tabular-nums">
            {lead.score}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </span>
        )}
        <StatusSelect leadId={lead.id} status={lead.status} />
        <FollowUpChip lead={lead} />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="hover:text-foreground hover:underline">
            {lead.phone}
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="hover:text-foreground hover:underline">
            {lead.email}
          </a>
        )}
        <span>{lead.location}</span>
        {lead.last_contacted_at && <span>Last spoke {formatRelativeIST(lead.last_contacted_at)}</span>}
        {open && lead.next_follow_up_at && (
          <span>
            Follow-up {formatDayIST(lead.next_follow_up_at)}
            {lead.follow_up_reason && `: ${lead.follow_up_reason}`}
          </span>
        )}
      </div>
    </div>
  );
}
