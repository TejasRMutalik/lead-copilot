// One compact row in the lead list. The whole card links to the lead page.

import Link from "next/link";
import { TierBadge } from "@/components/tier-badge";
import { Badge } from "@/components/ui/badge";
import { dayDiffIST } from "@/lib/dates";
import type { Lead } from "@/types";

// Follow-up chip text and color, compared by IST calendar day.
function followUpChip(lead: Lead): { text: string; className: string } | null {
  if (!lead.next_follow_up_at || lead.status === "won" || lead.status === "lost") return null;
  const days = dayDiffIST(lead.next_follow_up_at);
  if (days < 0) {
    return { text: `Overdue ${-days}d`, className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" };
  }
  if (days === 0) {
    return { text: "Due today", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" };
  }
  return { text: `In ${days}d`, className: "bg-muted text-muted-foreground" };
}

export function LeadCard({ lead }: { lead: Lead }) {
  const chip = followUpChip(lead);

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
        {chip && <Badge className={chip.className}>{chip.text}</Badge>}
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
