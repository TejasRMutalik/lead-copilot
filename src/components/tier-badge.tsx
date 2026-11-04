// Small colored badge for a lead's tier: hot is red, warm is amber, cold is slate.

import { Badge } from "@/components/ui/badge";
import type { Tier } from "@/types";

const STYLES: Record<Tier, string> = {
  hot: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  warm: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  cold: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export function TierBadge({ tier }: { tier: Tier | null }) {
  if (!tier) return <Badge variant="outline">Not analyzed</Badge>;
  return <Badge className={`${STYLES[tier]} uppercase`}>{tier}</Badge>;
}
