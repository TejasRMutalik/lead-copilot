"use client";

// "How did the call go?" box on the lead page. Sends the notes to /api/leads/[id]/debrief and shows the result card.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DebriefResult } from "@/components/debrief-result";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DebriefSummary } from "@/types";

const PLACEHOLDER =
  "Example: spoke 10 min, wife wants 3BHK not 2, budget can stretch to 1.1Cr, wants site visit Sat, worried about possession date";

export function DebriefForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DebriefSummary | null>(null);

  // `body` is { notes } for typed notes, or { outcome: "no_answer" } for the quick button.
  async function submit(body: { notes?: string; outcome?: "no_answer" }) {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setResult(json.data.result);
        if (body.notes) setNotes("");
        router.refresh(); // score, analysis and timeline on the page update
      } else {
        // The notes stay in the box, so "Update lead" works as a retry.
        const saved = String(json.error?.code ?? "").startsWith("AI_") ? " Your notes are saved: try again." : "";
        setError(`${json.error?.message ?? "Could not update the lead."}${saved}`);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={4000}
        disabled={running}
        placeholder={PLACEHOLDER}
        aria-label="How did the call go?"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={running} onClick={() => submit({ outcome: "no_answer" })}>
          No answer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={running}
          onClick={() => setNotes("Customer was busy and asked me to call back. ")}
        >
          Busy, call back
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={running}
          onClick={() => setNotes("Site visit booked for ")}
        >
          Site visit booked
        </Button>
      </div>
      <Button type="button" disabled={running || notes.trim().length < 10} onClick={() => submit({ notes })}>
        {running ? "Updating lead..." : "Update lead"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <DebriefResult summary={result} />}
    </div>
  );
}
