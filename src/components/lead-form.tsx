"use client";

// The new-lead form. Checks the fields in the browser first, then saves the lead and opens its page.

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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

// Different made-up leads for the "Fill sample" button. Phones and emails are fake and match no demo lead.
const SAMPLES: Fields[] = [
  {
    name: "Neha Gupta",
    phone: "+91 99000 11001",
    email: "neha.gupta@example.com",
    location: "Whitefield, Bengaluru",
    property_req: "3 BHK apartment, ready to move, near ITPL",
    budget_text: "1.2 Cr - 1.4 Cr",
    timeline_text: "Within 2 months",
    message:
      "Hi, we are shifting from Chennai for work and need a 3 BHK in Whitefield. Home loan is pre-approved. Can we see 2-3 options this weekend? Parking and a good school nearby are important.",
  },
  {
    name: "Karthik Subramanian",
    phone: "+91 99000 11002",
    email: "karthik.s@example.com",
    location: "Sarjapur Road, Bengaluru",
    property_req: "2 BHK apartment in a gated community",
    budget_text: "80 - 90 lakh",
    timeline_text: "3 to 4 months",
    message:
      "Hello, I work from home and want a 2 BHK on Sarjapur Road with a quiet balcony and good internet. I have 30 lakh saved and will take a loan for the rest. What are my options?",
  },
  {
    name: "Farhan Ali",
    phone: "+91 99000 11003",
    email: "",
    location: "Electronic City, Bengaluru",
    property_req: "2 BHK flat, quick possession",
    budget_text: "55 - 60 lakh",
    timeline_text: "Next month",
    message:
      "Bhai, Electronic City mein 2BHK chahiye, budget 55-60 lakh. Possession jaldi chahiye, next month tak. Loan ho jayega. Kab call kar sakte ho?",
  },
  {
    name: "Divya Menon",
    phone: "+91 99000 11004",
    email: "divya.menon@example.com",
    location: "Hebbal, Bengaluru",
    property_req: "3 BHK near the Outer Ring Road",
    budget_text: "1.0 - 1.15 Cr",
    timeline_text: "Around 6 months",
    message:
      "Hi, we are looking at Hebbal for a 3 BHK. Not in a hurry, but we want to understand prices and which projects have good schools around. Can you send details?",
  },
  {
    name: "Suresh Patil",
    phone: "+91 99000 11005",
    email: "suresh.patil@example.com",
    location: "Yelahanka, Bengaluru",
    property_req: "30x40 residential plot, BDA approved",
    budget_text: "85 - 95 lakh",
    timeline_text: "Within 3 months",
    message:
      "I want to buy a 30x40 plot in Yelahanka to build my own house. BDA approved only, clear title. Budget up to 95 lakh, ready to pay a token this month if the papers are clean.",
  },
  {
    name: "Aisha Rahman",
    phone: "+91 99000 11006",
    email: "aisha.rahman@example.com",
    location: "HSR Layout, Bengaluru",
    property_req: "1 BHK flat for rent, furnished",
    budget_text: "25 - 28k per month",
    timeline_text: "Move in by 1 December",
    message:
      "Looking for a furnished 1 BHK on rent in HSR Layout, budget 28k per month. I am a software engineer, no pets. Need to move by 1 December. Please share what is available.",
  },
];

export function LeadForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const lastSample = useRef(-1); // so the same sample is not shown twice in a row
  const [duplicates, setDuplicates] = useState<{ input: LeadInput; candidates: DuplicateCandidate[] } | null>(null);
  const [resolving, setResolving] = useState(false);

  function setField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  // Fills the form with a random sample lead, different from the previous one.
  function fillSample() {
    let next = Math.floor(Math.random() * SAMPLES.length);
    if (next === lastSample.current) next = (next + 1) % SAMPLES.length;
    lastSample.current = next;
    setFields(SAMPLES[next]);
    setErrors({});
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
        <Button type="button" variant="outline" disabled={submitting} onClick={fillSample}>
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
