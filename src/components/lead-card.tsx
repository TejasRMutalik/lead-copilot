// One compact row in the lead list. The whole card links to the lead page.

import Link from "next/link";
import { FollowUpChip } from "@/components/follow-up-chip";
import { TierBadge } from "@/components/tier-badge";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TierBadge tier={lead.tier} />
        {lead.score !== null && <span className="text-sm font-medium">{lead.score}</span>}
        <span className="font-medium">{lead.name}</span>
        <span className="text-sm text-muted-foreground">{lead.location}</span>
        <FollowUpChip lead={lead} />
        <Badge variant="outline" className="ml-auto capitalize">
          {lead.status}
        </Badge>
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">{lead.property_req}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Badge variant="secondary">{lead.budget_text}</Badge>
        <Badge variant="secondary">{lead.timeline_text}</Badge>
      </div>
      <p className="mt-2 truncate text-sm">
        {lead.analysis ? lead.analysis.next_action : "Not analyzed yet. Open the lead to run the analysis."}
      </p>
    </Link>
  );
}
