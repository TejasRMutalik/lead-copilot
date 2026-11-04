// Badge for a lead's follow-up date: "Overdue 2d" (red), "Due today" (amber), "In 3d" (grey). Hidden for closed leads.

import { Badge } from "@/components/ui/badge";
import { dayDiffIST } from "@/lib/dates";
import type { Lead } from "@/types";

export function FollowUpChip({ lead }: { lead: Lead }) {
  if (!lead.next_follow_up_at || lead.status === "won" || lead.status === "lost") return null;
  const days = dayDiffIST(lead.next_follow_up_at);

  if (days < 0) {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">Overdue {-days}d</Badge>;
  }
  if (days === 0) {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">Due today</Badge>;
  }
  return <Badge className="bg-muted text-muted-foreground">In {days}d</Badge>;
}
