"use client";

// The Today panel at the top of the home page: who to contact first, why, what to say, and a ready message.
// It loads on the client so the lead list below is never held up by the AI.

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CopyButton } from "@/components/copy-button";
import { TierBadge } from "@/components/tier-badge";
import { RESET_EVENT } from "@/components/reset-demo-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayIST, greetingIST, weekdayIST } from "@/lib/dates";
import { dueChipText } from "@/lib/due";
import { whatsappUrl } from "@/lib/whatsapp";
import type { BriefingItem, BriefingResponse } from "@/types";

const COLLAPSED_KEY = "today-panel-collapsed";
const REFRESH_COOLDOWN_MS = 60_000;

const CHIP_STYLES: Record<BriefingItem["reason"], string> = {
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  due_today: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  going_cold: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  new_hot: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

// Client-only values (the clock, localStorage) are read with useSyncExternalStore: the server renders the
// fallback, then the browser swaps in the real value without a hydration mismatch.
const noSubscribe = () => () => {};

function greetingLine(): string {
  const now = new Date();
  return `${greetingIST(now)}. ${weekdayIST(now)}, ${formatDayIST(now)}`;
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false; // storage can be blocked; the panel simply starts open
  }
}

async function fetchBriefing(refresh: boolean): Promise<{ data?: BriefingResponse; error?: string }> {
  try {
    const res = await fetch(refresh ? "/api/briefing?refresh=1" : "/api/briefing");
    const json = await res.json();
    return json.ok ? { data: json.data } : { error: json.error?.message ?? "Could not load today's plan." };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export function TodayPanel() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapseChoice, setCollapseChoice] = useState<boolean | null>(null); // null until the user clicks
  const [coolingDown, setCoolingDown] = useState(false);

  const greeting = useSyncExternalStore(noSubscribe, greetingLine, () => "");
  const savedCollapsed = useSyncExternalStore(noSubscribe, readCollapsed, () => false);
  const collapsed = collapseChoice ?? savedCollapsed;

  function show(result: { data?: BriefingResponse; error?: string }) {
    if (result.data) setData(result.data);
    setError(result.error ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void fetchBriefing(false).then(show);
    // After "Reset demo" the old plan is gone, so load the new one.
    const onReset = () => void fetchBriefing(false).then(show);
    window.addEventListener(RESET_EVENT, onReset);
    return () => window.removeEventListener(RESET_EVENT, onReset);
  }, []);

  async function load(refresh: boolean) {
    setLoading(true);
    setError(null);
    show(await fetchBriefing(refresh));
  }

  function toggle() {
    const next = !collapsed;
    setCollapseChoice(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Not remembering the choice is fine.
    }
  }

  // "Refresh plan" builds a new plan, then waits a minute before it can be used again.
  async function refresh() {
    setCoolingDown(true);
    setTimeout(() => setCoolingDown(false), REFRESH_COOLDOWN_MS);
    await load(true);
  }

  return (
    <section className="space-y-2 rounded-lg border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-base font-semibold">Today</h2>
          <p className="text-xs text-muted-foreground">{greeting || " "}</p>
        </div>
        <div className="flex gap-1">
          {!collapsed && (
            <Button variant="ghost" size="sm" disabled={loading || coolingDown} onClick={refresh}>
              Refresh
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={toggle}>
            {collapsed ? "Show" : "Hide"}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <>
          {loading && !data && <Skeleton className="h-10 w-full" />}
          {error && (
            <p className="text-sm text-destructive">
              {error}{" "}
              <Button variant="outline" size="sm" onClick={() => load(false)}>
                Retry
              </Button>
            </p>
          )}
          {data && <Plan data={data} loading={loading} onRetry={() => load(true)} />}
        </>
      )}
    </section>
  );
}

const VISIBLE_ROWS = 3; // the rest are behind "Show all"

function Plan({ data, loading, onRetry }: { data: BriefingResponse; loading: boolean; onRetry: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? data.items : data.items.slice(0, VISIBLE_ROWS);
  const hidden = data.items.length - rows.length;

  return (
    <div className={`space-y-1 ${loading ? "opacity-60" : ""}`}>
      <p className="text-sm font-medium">{data.headline}</p>
      {data.ai_failed && (
        <p className="text-xs text-muted-foreground">
          AI plan unavailable, showing the due list only.{" "}
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </p>
      )}
      <ol className="divide-y">
        {rows.map((item, index) => (
          <BriefingRow key={item.lead_id} item={item} number={index + 1} />
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {hidden > 0 && (
          <button type="button" className="underline hover:text-foreground" onClick={() => setShowAll(true)}>
            Show all {data.items.length}
          </button>
        )}
        {showAll && data.items.length > VISIBLE_ROWS && (
          <button type="button" className="underline hover:text-foreground" onClick={() => setShowAll(false)}>
            Show less
          </button>
        )}
        {data.total_due > data.items.length && (
          <span>+{data.total_due - data.items.length} more due (the lead list below shows overdue first)</span>
        )}
      </div>
    </div>
  );
}

const LINK_BUTTON =
  "inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium hover:bg-muted";

// One line per lead. Click it to see what to say and the action buttons.
function BriefingRow({ item, number }: { item: BriefingItem; number: number }) {
  const whatsapp = item.draft_message ? whatsappUrl(item.phone_norm, item.draft_message) : null;

  return (
    <li>
      <details className="group py-1.5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
          <span className="text-muted-foreground">{number}.</span>
          <span className="shrink-0 font-medium">{item.name}</span>
          <TierBadge tier={item.tier} />
          <Badge className={CHIP_STYLES[item.reason]}>{dueChipText(item.reason, item.days)}</Badge>
          <span className="hidden min-w-0 flex-1 truncate text-muted-foreground md:inline">{item.why_now}</span>
        </summary>
        <div className="space-y-2 pb-1 pl-6 pt-1.5">
          <p className="text-sm md:hidden">{item.why_now}</p>
          {item.opening_line && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Open with:</span> {item.opening_line}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {item.draft_message && <CopyButton text={item.draft_message} />}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={LINK_BUTTON}>
                WhatsApp
              </a>
            )}
            <Link href={`/leads/${item.lead_id}`} className={LINK_BUTTON}>
              Open lead
            </Link>
            <Link href={`/leads/${item.lead_id}#debrief`} className={LINK_BUTTON}>
              Mark done
            </Link>
          </div>
        </div>
      </details>
    </li>
  );
}
