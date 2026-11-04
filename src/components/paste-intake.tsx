"use client";

// The Paste tab: paste a messy dump (or upload a WhatsApp export), review the extracted draft leads, then save them one at a time
// (each save also runs the AI analysis, so progress is shown lead by lead).

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DuplicateDialog } from "@/components/duplicate-dialog";
import { readChatFile } from "@/lib/chat-file";
import { mergeLead, postLead } from "@/lib/lead-client";
import type { DuplicateCandidate, LeadInput } from "@/types";
import { SAMPLE_DUMP } from "@/lib/sample-dump";
import { LeadInputSchema } from "@/lib/validation";

type FieldName =
  | "name"
  | "phone"
  | "email"
  | "location"
  | "property_req"
  | "budget_text"
  | "timeline_text"
  | "message";

type SaveStatus = "pending" | "saving" | "saved" | "merged" | "skipped" | "unanalyzed" | "failed";

// What the user chose in the duplicate dialog.
type DuplicateChoice = { action: "merge"; leadId: string } | { action: "new" } | { action: "cancel" };

type DuplicatePrompt = {
  draft: Draft;
  candidates: DuplicateCandidate[];
  resolve: (choice: DuplicateChoice) => void;
};

type Draft = Record<FieldName, string> & {
  key: number;
  include: boolean;
  status: SaveStatus;
  leadId?: string;
};

const COLUMNS: { name: FieldName; label: string }[] = [
  { name: "name", label: "Name" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email" },
  { name: "location", label: "Location" },
  { name: "property_req", label: "Property" },
  { name: "budget_text", label: "Budget" },
  { name: "timeline_text", label: "Timeline" },
  { name: "message", label: "Message" },
];

const RATE_LIMIT_WAIT_MS = 5000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Only the lead fields, without the table bookkeeping (key, include, status).
function toInput(draft: Draft): LeadInput {
  return Object.fromEntries(COLUMNS.map((c) => [c.name, draft[c.name]])) as LeadInput;
}

// Which fields of a draft fail the same rules the lead form uses (empty required fields, bad email).
function invalidFields(draft: Draft): Set<string> {
  const result = LeadInputSchema.safeParse(draft);
  return new Set(result.success ? [] : result.error.issues.map((issue) => String(issue.path[0])));
}

export function PasteIntake() {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [unparsed, setUnparsed] = useState("");
  const [saving, setSaving] = useState(false);
  const [progressNote, setProgressNote] = useState("");
  const [finished, setFinished] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<DuplicatePrompt | null>(null);

  // Warn before leaving the page while the save queue is running.
  useEffect(() => {
    if (!saving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving]);

  // Reads an uploaded WhatsApp export, puts its text in the box and extracts the leads straight away.
  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again
    if (!file) return;
    try {
      const { text: chatText, trimmed } = await readChatFile(file);
      if (chatText.length < 20) {
        toast.error("That file has no chat text in it.");
        return;
      }
      setText(chatText);
      if (trimmed) toast.warning("Long chat: using the newest messages only.");
      await extract(chatText);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  async function extract(source: string = text) {
    setParsing(true);
    setFinished(false);
    try {
      const res = await fetch("/api/intake/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error?.message ?? "Could not read the pasted text.");
        return;
      }
      const leads = json.data.leads as Partial<Record<FieldName, string>>[];
      setDrafts(
        leads.map((lead, i) => ({
          key: i,
          include: true,
          status: "pending",
          name: lead.name ?? "",
          phone: lead.phone ?? "",
          email: lead.email ?? "",
          location: lead.location ?? "",
          property_req: lead.property_req ?? "",
          budget_text: lead.budget_text ?? "",
          timeline_text: lead.timeline_text ?? "",
          message: lead.message ?? "",
        })),
      );
      setUnparsed(json.data.unparsed_text);
      if (json.data.truncated) toast.warning("More than 15 enquiries found. Paste the rest separately.");
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  function update(key: number, patch: Partial<Draft>) {
    setDrafts((current) => current?.map((d) => (d.key === key ? { ...d, ...patch } : d)) ?? null);
  }

  const toSave = (drafts ?? []).filter((d) => d.include && (d.status === "pending" || d.status === "failed"));
  const canSave = toSave.length > 0 && toSave.every((d) => invalidFields(d).size === 0);

  // Pauses the queue until the user answers the duplicate dialog for this draft.
  function askAboutDuplicate(draft: Draft, candidates: DuplicateCandidate[]) {
    return new Promise<DuplicateChoice>((resolve) => setDuplicatePrompt({ draft, candidates, resolve }));
  }

  function answerDuplicate(choice: DuplicateChoice) {
    duplicatePrompt?.resolve(choice);
    setDuplicatePrompt(null);
  }

  // The save and merge routes save first and analyze second, so a rate limit leaves a saved,
  // unanalyzed lead that we can analyze again after a pause.
  async function settle(leadId: string, name: string, warning: string | undefined, done: SaveStatus) {
    if (!warning) return done;
    if (warning === "AI_RATE_LIMIT") {
      setProgressNote(`Rate limit reached, waiting 5 seconds before retrying ${name}...`);
      await wait(RATE_LIMIT_WAIT_MS);
      const retry = await fetch(`/api/leads/${leadId}/analyze`, { method: "POST" });
      if ((await retry.json()).ok) return done;
    }
    return "unanalyzed";
  }

  async function saveOne(draft: Draft): Promise<SaveStatus> {
    const input = toInput(draft);
    let outcome = await postLead(input, "paste");
    let done: SaveStatus = "saved";

    if (outcome.kind === "duplicates") {
      setProgressNote(`${draft.name} looks like an existing lead. Waiting for your choice...`);
      const choice = await askAboutDuplicate(draft, outcome.candidates);
      if (choice.action === "cancel") return "skipped";
      setProgressNote(`Saving... analyzing ${draft.name}`);
      if (choice.action === "merge") {
        outcome = await mergeLead(choice.leadId, input, "paste");
        done = "merged";
      } else {
        outcome = await postLead(input, "paste", true);
      }
    }

    if (outcome.kind !== "saved") return "failed";
    update(draft.key, { leadId: outcome.lead.id });
    return settle(outcome.lead.id, draft.name, outcome.warning, done);
  }

  async function saveAll() {
    setSaving(true);
    setFinished(false);
    const queue = toSave;
    for (const [i, draft] of queue.entries()) {
      update(draft.key, { status: "saving" });
      setProgressNote(`Saving ${i + 1} of ${queue.length}... analyzing ${draft.name}`);
      let status: SaveStatus;
      try {
        status = await saveOne(draft);
      } catch {
        status = "failed";
      }
      update(draft.key, { status });
    }
    setProgressNote("");
    setSaving(false);
    setFinished(true);
  }

  const included = (drafts ?? []).filter((d) => d.include);
  const done = included.filter((d) => d.status !== "pending" && d.status !== "saving").length;
  const count = (status: SaveStatus) => (drafts ?? []).filter((d) => d.status === status).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={15000}
          disabled={parsing || saving}
          placeholder="Paste WhatsApp chats, emails or portal enquiries here..."
        />
        <p className="text-xs text-muted-foreground">{text.length}/15000</p>
        <div className="flex gap-2">
          <Button onClick={() => extract()} disabled={parsing || saving || text.trim().length < 20}>
            {parsing ? "Extracting leads..." : "Extract leads"}
          </Button>
          <Button variant="outline" disabled={parsing || saving} onClick={() => fileInput.current?.click()}>
            Upload WhatsApp export
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".zip,.txt"
            className="hidden"
            onChange={onFileChosen}
          />
          <Button variant="outline" disabled={parsing || saving} onClick={() => setText(SAMPLE_DUMP)}>
            Load sample dump
          </Button>
        </div>
      </div>

      {drafts && drafts.length === 0 && (
        <div className="rounded-md border p-4 text-sm">
          <p className="font-medium">No enquiries found.</p>
          {unparsed && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{unparsed}</p>}
        </div>
      )}

      {drafts && drafts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Review the drafts. Red fields are required and were not found in the text: fill them in, or type
            &quot;Unknown&quot; if you really do not know.
          </p>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Save</TableHead>
                  {COLUMNS.map((c) => (
                    <TableHead key={c.name}>{c.label}</TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => {
                  const invalid = invalidFields(draft);
                  const locked = saving || !["pending", "failed"].includes(draft.status);
                  return (
                    <TableRow key={draft.key}>
                      <TableCell>
                        <Checkbox
                          checked={draft.include}
                          disabled={locked}
                          onCheckedChange={(checked) => update(draft.key, { include: checked === true })}
                          aria-label={`Include ${draft.name || "lead"}`}
                        />
                      </TableCell>
                      {COLUMNS.map((c) => (
                        <TableCell key={c.name}>
                          <Input
                            className="min-w-36"
                            value={draft[c.name]}
                            disabled={locked}
                            aria-invalid={draft.include && invalid.has(c.name) ? true : undefined}
                            onChange={(e) => update(draft.key, { [c.name]: e.target.value })}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-sm">
                        <StatusCell draft={draft} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={locked}
                          onClick={() => setDrafts((current) => current?.filter((d) => d.key !== draft.key) ?? null)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {unparsed && (
            <p className="whitespace-pre-wrap text-xs text-muted-foreground">Not matched to a lead: {unparsed}</p>
          )}

          {(saving || finished) && included.length > 0 && <Progress value={(done / included.length) * 100} />}
          {saving && <p className="text-sm">{progressNote}</p>}

          {finished && (
            <div className="rounded-md border p-3 text-sm">
              {count("saved")} saved
              {count("merged") > 0 && `, ${count("merged")} merged`}
              {count("skipped") > 0 && `, ${count("skipped")} skipped`}
              {count("unanalyzed") > 0 && `, ${count("unanalyzed")} saved but need analysis`}
              {count("failed") > 0 && `, ${count("failed")} failed (fix and save again)`}.{" "}
              <Link href="/" className="underline">
                Back to the lead list
              </Link>
            </div>
          )}

          <Button onClick={saveAll} disabled={!canSave || saving}>
            {saving ? "Saving..." : `Save ${toSave.length} lead${toSave.length === 1 ? "" : "s"}`}
          </Button>

          {duplicatePrompt && (
            <DuplicateDialog
              incoming={toInput(duplicatePrompt.draft)}
              candidates={duplicatePrompt.candidates}
              busy={false}
              onMerge={(leadId) => answerDuplicate({ action: "merge", leadId })}
              onSaveNew={() => answerDuplicate({ action: "new" })}
              onCancel={() => answerDuplicate({ action: "cancel" })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatusCell({ draft }: { draft: Draft }) {
  if (draft.status === "saving") return <span>Saving...</span>;
  if (draft.status === "failed") return <span className="text-destructive">Failed</span>;
  if (draft.status === "skipped") return <span className="text-muted-foreground">Skipped</span>;
  if (draft.status === "saved" || draft.status === "merged" || draft.status === "unanalyzed") {
    const label = { saved: "Saved", merged: "Merged", unanalyzed: "Saved, not analyzed" }[draft.status];
    return (
      <Link href={`/leads/${draft.leadId}`} className="underline">
        {label}
      </Link>
    );
  }
  return null;
}
