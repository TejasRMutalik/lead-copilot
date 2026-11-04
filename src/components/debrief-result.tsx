// The card shown after a debrief: score change, new objections, follow-up date and the follow-up message.

import { CopyButton } from "@/components/copy-button";
import { formatDayIST, formatRelativeIST } from "@/lib/dates";
import type { DebriefSummary } from "@/types";

function scoreLine(summary: DebriefSummary): string {
  const { old_score, new_score, new_tier } = summary;
  if (new_score === null) return "Score unchanged";
  const tier = new_tier ? `, now ${new_tier[0].toUpperCase()}${new_tier.slice(1)}` : "";
  if (old_score === new_score) return `Score stays ${new_score}${tier}`;
  return `${old_score ?? "-"} -> ${new_score}${tier}`;
}

export function DebriefResult({ summary }: { summary: DebriefSummary }) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted p-3 text-sm">
      <p className="text-base font-semibold">{scoreLine(summary)}</p>
      {summary.note && <p className="text-muted-foreground">{summary.note}</p>}

      {summary.new_objections.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">New objections</p>
          <ul className="list-disc pl-5 text-amber-700 dark:text-amber-400">
            {summary.new_objections.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">Follow-up</p>
        {summary.follow_up_at ? (
          <p>
            {formatDayIST(summary.follow_up_at)} ({formatRelativeIST(summary.follow_up_at)})
            {summary.follow_up_reason && `: ${summary.follow_up_reason}`}
          </p>
        ) : (
          <p>No follow-up scheduled.</p>
        )}
      </div>

      {summary.follow_up_message && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">Follow-up message</p>
          <p className="whitespace-pre-wrap rounded-lg bg-background p-3">{summary.follow_up_message}</p>
          <CopyButton text={summary.follow_up_message} />
        </div>
      )}
    </div>
  );
}
