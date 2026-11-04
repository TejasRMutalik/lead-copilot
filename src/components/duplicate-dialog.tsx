"use client";

// Shown when a new enquiry looks like an existing lead: old and new side by side, and three choices.

import { useState } from "react";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DuplicateCandidate, LeadInput } from "@/types";

type Props = {
  incoming: LeadInput;
  candidates: DuplicateCandidate[];
  busy: boolean;
  onMerge: (leadId: string) => void;
  onSaveNew: () => void;
  onCancel: () => void;
};

const ROWS: { label: string; field: keyof LeadInput }[] = [
  { label: "Phone", field: "phone" },
  { label: "Email", field: "email" },
  { label: "Location", field: "location" },
  { label: "Property", field: "property_req" },
  { label: "Budget", field: "budget_text" },
  { label: "Timeline", field: "timeline_text" },
  { label: "Message", field: "message" },
];

export function DuplicateDialog({ incoming, candidates, busy, onMerge, onSaveNew, onCancel }: Props) {
  const [selected, setSelected] = useState(0);
  const candidate = candidates[selected];
  const existing = candidate.lead;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>This looks like an existing lead</DialogTitle>
          <DialogDescription>
            {candidate.reason}
            {candidate.matchType === "ai" && ` (AI confidence ${Math.round(candidate.confidence * 100)}%)`}. Merging adds
            the new message to their history and re-runs the analysis.
          </DialogDescription>
        </DialogHeader>

        {candidates.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {candidates.map((c, i) => (
              <Button
                key={c.lead.id}
                type="button"
                size="sm"
                variant={i === selected ? "default" : "outline"}
                onClick={() => setSelected(i)}
              >
                {c.lead.name}
              </Button>
            ))}
          </div>
        )}

        <div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto text-sm">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium">
              Existing: {existing.name} <TierBadge tier={existing.tier} />
            </p>
            <p className="text-xs text-muted-foreground">Status: {existing.status}</p>
            {ROWS.map((row) => (
              <Field key={row.field} label={row.label} value={existing[row.field]} />
            ))}
          </div>
          <div className="space-y-2">
            <p className="font-medium">New: {incoming.name}</p>
            <p className="text-xs text-muted-foreground">Not saved yet</p>
            {ROWS.map((row) => (
              <Field key={row.field} label={row.label} value={incoming[row.field]} />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onSaveNew}>
            Save as new lead
          </Button>
          <Button type="button" disabled={busy} onClick={() => onMerge(existing.id)}>
            {busy ? "Working..." : "Merge into existing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="line-clamp-4 whitespace-pre-wrap break-words">{value || "-"}</p>
    </div>
  );
}
