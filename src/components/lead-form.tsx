"use client";

// The new-lead form. Checks the fields in the browser first, then saves the lead and opens its page.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DuplicateDialog } from "@/components/duplicate-dialog";
import { mergeLead, postLead, type SaveResult } from "@/lib/lead-client";
import { LeadInputSchema, MESSAGE_MAX } from "@/lib/validation";
import type { DuplicateCandidate, LeadInput } from "@/types";

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  location: "",
  property_req: "",
  budget_text: "",
  timeline_text: "",
  message: "",
};

type Fields = typeof EMPTY;

const SAMPLE: Fields = {
  name: "Priya Nair",
  phone: "+91 98450 12345",
  email: "priya.nair@example.com",
  location: "Whitefield, Bengaluru",
  property_req: "3 BHK apartment, ready to move, near ITPL",
  budget_text: "1.2 Cr - 1.4 Cr",
  timeline_text: "Within 2 months",
  message:
    "Hi, we are shifting from Chennai for work and need a 3 BHK in Whitefield. Home loan is pre-approved. Can we see 2-3 options this weekend? Parking and a good school nearby are important.",
};

export function LeadForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<{ input: LeadInput; candidates: DuplicateCandidate[] } | null>(null);
  const [resolving, setResolving] = useState(false);

  function setField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    // Check in the browser first so a missing field never calls the API.
    const result = LeadInputSchema.safeParse(fields);
    if (!result.success) {
      const found: Partial<Record<keyof Fields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!found[key]) found[key] = issue.message;
      }
      setErrors(found);
      return;
    }
    setErrors({});

    setSubmitting(true);
    handleResult(await postLead(result.data, "form"), result.data);
  }

  // Saved: open the lead. Possible duplicate: nothing is saved yet, so ask the user. Error: show it.
  function handleResult(outcome: SaveResult, input: LeadInput) {
    if (outcome.kind === "duplicates") {
      setDuplicates({ input, candidates: outcome.candidates });
      setSubmitting(false);
      return;
    }
    if (outcome.kind === "error") {
      toast.error(outcome.message);
      setSubmitting(false);
      return;
    }
    if (outcome.warning) toast.warning("Lead saved, but the AI analysis failed. You can run it again.");
    router.push(`/leads/${outcome.lead.id}`);
  }

  async function resolve(action: () => Promise<SaveResult>, input: LeadInput) {
    setResolving(true);
    handleResult(await action(), input);
    setResolving(false);
    setDuplicates(null);
  }

  // One label + input + inline error. `long` makes a textarea.
  function field(name: keyof Fields, label: string, opts: { required?: boolean; long?: boolean } = {}) {
    const common = {
      id: name,
      value: fields[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setField(name, e.target.value),
      "aria-invalid": errors[name] ? true : undefined,
      disabled: submitting,
    };
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>
          {label}
          {opts.required && <span className="text-destructive"> *</span>}
        </Label>
        {opts.long ? <Textarea rows={6} {...common} /> : <Input {...common} />}
        {opts.long && (
          <p className="text-xs text-muted-foreground">
            {fields[name].length}/{MESSAGE_MAX}
          </p>
        )}
        {errors[name] && <p className="text-sm text-destructive">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        {field("name", "Name", { required: true })}
        {field("location", "Location wanted", { required: true })}
        {field("phone", "Phone")}
        {field("email", "Email")}
        {field("property_req", "Property wanted", { required: true })}
        {field("budget_text", "Budget", { required: true })}
        {field("timeline_text", "Timeline", { required: true })}
      </div>
      {field("message", "Customer message", { required: true, long: true })}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Analyzing lead..." : "Save and analyze"}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={() => setFields(SAMPLE)}>
          Fill sample
        </Button>
      </div>
      {duplicates && (
        <DuplicateDialog
          incoming={duplicates.input}
          candidates={duplicates.candidates}
          busy={resolving}
          onMerge={(leadId) => resolve(() => mergeLead(leadId, duplicates.input, "form"), duplicates.input)}
          onSaveNew={() => resolve(() => postLead(duplicates.input, "form", true), duplicates.input)}
          onCancel={() => setDuplicates(null)}
        />
      )}
    </form>
  );
}
