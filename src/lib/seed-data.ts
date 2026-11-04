// The demo leads: what each customer wrote and what happened since. Dates are "days ago" or "days from today",
// so the demo always looks current. The AI analyses are precomputed in seed-analyses.json (see scripts/gen-seed-analyses.ts).

import type { DebriefSummary, LeadAnalysis, LeadInput, LeadStatus } from "@/types";

export type SignalKey = keyof LeadAnalysis["signals"];

// A call that was already logged. signalChanges are added to the analysis signals (kept within 0 to 3).
export type SeedDebrief = {
  daysAgo: number;
  notes: string;
  outcome: DebriefSummary["call_outcome"];
  signalChanges: Partial<Record<SignalKey, number>>;
  newObjections: string[];
  followUpDays: number;
  followUpMessage: string;
};

// The customer wrote again later and the repeat enquiry was merged into this lead.
export type SeedMerge = {
  daysAgo: number;
  source: "form" | "paste";
  newMessage: string;
  updated: { budget_text: string; timeline_text: string };
};

export type SeedLead = {
  input: LeadInput; // as first entered
  status: LeadStatus;
  createdDaysAgo: number;
  contactedDaysAgo?: number; // last real conversation
  followUpInDays?: number; // negative = overdue
  followUpReason?: string;
  merge?: SeedMerge;
  debriefs?: SeedDebrief[]; // oldest first
};

export const SEED_LEADS: SeedLead[] = [
  {
    input: {
      name: "Arjun Reddy",
      phone: "+91 90000 00001",
      email: "arjun.reddy@example.com",
      location: "Whitefield, Bengaluru",
      property_req: "3 BHK apartment, ready to move, near ITPL",
      budget_text: "1.3 - 1.5 Cr",
      timeline_text: "Within 1 month",
      message:
        "Hello, I am relocating from Hyderabad next month for work at ITPL. Looking for a ready 3 BHK in Whitefield, gated community with a good school nearby. Home loan is pre-approved up to 1.4 Cr. Can we visit this weekend?",
    },
    status: "negotiating",
    createdDaysAgo: 9,
    contactedDaysAgo: 3,
    followUpInDays: -2,
    followUpReason: "Ask how the site visit went and share the next options",
    debriefs: [
      {
        daysAgo: 6,
        notes:
          "Spoke 8 min. Still wants 3BHK in Whitefield but is also comparing Sarjapur Road. Worried about the possession date and says 1.3 Cr is his real limit. Wants a few days to think.",
        outcome: "needs_time",
        signalChanges: { timeline_urgency: -1, budget_fit: -1 },
        newObjections: ["Worried about the possession date", "Comparing Sarjapur Road"],
        followUpDays: 3,
        followUpMessage:
          "Hi Arjun, I have shortlisted two ready-to-move 3 BHKs in Whitefield with confirmed possession. Shall I book a site visit for Saturday?",
      },
      {
        daysAgo: 3,
        notes:
          "Called again. Husband and wife both liked the Whitefield option. Budget can stretch to 1.5 Cr if parking is included. Site visit Saturday.",
        outcome: "site_visit_booked",
        signalChanges: { timeline_urgency: 1, budget_fit: 1 },
        newObjections: [],
        followUpDays: 3,
        followUpMessage:
          "Hi Arjun, hope the site visit went well. Did the Whitefield 3 BHK meet your expectations on parking and school distance?",
      },
    ],
  },
  {
    input: {
      name: "Meera Krishnan",
      phone: "+91 90000 00002",
      email: "meera.k@example.com",
      location: "Sarjapur Road, Bengaluru",
      property_req: "2 BHK apartment, under construction is fine",
      budget_text: "75 - 85 lakh",
      timeline_text: "2 to 3 months",
      message:
        "Hi, we are a couple looking for a 2 BHK on Sarjapur Road. Budget is 80 lakh, loan eligibility not checked yet. Is possession in 6 months possible? Please send details of options.",
    },
    status: "contacted",
    createdDaysAgo: 6,
    contactedDaysAgo: 2,
    followUpInDays: 0,
    followUpReason: "Send the shortlist and ask about loan eligibility",
  },
  {
    input: {
      name: "Rohit Sharma",
      phone: "+91 90000 00003",
      email: "rohit.sharma@example.com",
      location: "HSR Layout, Bengaluru",
      property_req: "2 BHK flat for rent, semi-furnished",
      budget_text: "35 - 40k per month",
      timeline_text: "Move in by 1 December",
      message:
        "Looking for a 2BHK on rent in HSR Layout sector 2 or 7. Budget 38k per month. Need to shift by 1 December. Family of 3, no pets. Please share available flats.",
    },
    status: "contacted",
    createdDaysAgo: 4,
    contactedDaysAgo: 2,
    followUpInDays: -1,
    followUpReason: "Call back with three rental options in HSR Layout",
  },
  {
    input: {
      name: "Sneha Iyer",
      phone: "+91 90000 00004",
      email: "sneha.iyer@example.com",
      location: "Hebbal, Bengaluru",
      property_req: "3 BHK apartment near the Outer Ring Road",
      budget_text: "1.0 - 1.2 Cr",
      timeline_text: "3 to 4 months",
      message:
        "Hi, we saw your listing for Hebbal. Looking for a 3 BHK near the Outer Ring Road, budget around 1.1 Cr. We have a 4 year old child, so a good school and a park nearby matter. When can we see the apartment?",
    },
    status: "contacted",
    createdDaysAgo: 5,
    contactedDaysAgo: 1,
    followUpInDays: 0,
    followUpReason: "Book the Hebbal site visit",
  },
  {
    input: {
      name: "Imran Khan",
      phone: "+91 90000 00005",
      email: "imran.khan@example.com",
      location: "Electronic City, Bengaluru",
      property_req: "2 BHK ready to move, Phase 1",
      budget_text: "55 - 60 lakh",
      timeline_text: "Immediately",
      message:
        "Need a 2BHK ready to move in Electronic City phase 1. Budget 60L max, I can pay 20% down payment immediately. Please call me today.",
    },
    status: "new",
    createdDaysAgo: 0,
  },
  {
    input: {
      name: "Kavita Rao",
      phone: "+91 90000 00006",
      email: "kavita.rao@example.com",
      location: "Yelahanka, Bengaluru",
      property_req: "30x40 residential plot, BDA approved",
      budget_text: "85 - 95 lakh",
      timeline_text: "Around 6 months",
      message:
        "Interested in a 30x40 site in Yelahanka, BDA approved only. Budget 90 lakh. Planning to start building in about 6 months. Please send available plots and the documents.",
    },
    status: "contacted",
    createdDaysAgo: 7,
    contactedDaysAgo: 2,
    followUpInDays: 3,
    followUpReason: "Share plot options and legal documents",
  },
  {
    input: {
      name: "Vikram Singh",
      phone: "+91 90000 00007",
      email: null,
      location: "Kanakapura Road, Bengaluru",
      property_req: "2 BHK flat, quick possession",
      budget_text: "55 - 60 lakh",
      timeline_text: "Next month",
      message:
        "Bhai namaste, Kanakapura Road pe 2BHK chahiye, budget 55-60 lakh ke aaspaas hai. Possession jaldi chahiye, next month tak. Loan ho jayega. Aap kab call kar sakte ho? Site visit bhi karna hai.",
    },
    status: "contacted",
    createdDaysAgo: 10,
    contactedDaysAgo: 8,
  },
  {
    input: {
      name: "Ananya Das",
      phone: "+91 90000 00008",
      email: "ananya.das@example.com",
      location: "Bengaluru",
      property_req: "Not decided yet",
      budget_text: "Not sure",
      timeline_text: "Maybe next year",
      message: "Hi, just looking around for now. Might buy something next year. Can you send me some details?",
    },
    status: "new",
    createdDaysAgo: 3,
  },
  {
    input: {
      name: "Rajesh Menon",
      phone: "+91 90000 00009",
      email: "rajesh.menon@example.com",
      location: "Whitefield, Bengaluru",
      property_req: "4 BHK villa in a gated community, investment",
      budget_text: "3 - 3.5 Cr",
      timeline_text: "Within 3 months",
      message:
        "I am an NRI based in Dubai looking to invest in a villa in Whitefield or Sarjapur Road. Budget up to 3.5 Cr. Rental yield and resale value are my priority. Can you share RERA details and 2 to 3 options? Happy to do a video walkthrough.",
    },
    status: "negotiating",
    createdDaysAgo: 8,
    contactedDaysAgo: 1,
    followUpInDays: 2,
    followUpReason: "Send RERA details and arrange the video walkthrough",
  },
  {
    input: {
      name: "Pooja Nambiar",
      phone: "+91 90000 00010",
      email: "pooja.nambiar@example.com",
      location: "Sarjapur Road, Bengaluru",
      property_req: "2 BHK apartment",
      budget_text: "70 lakh",
      timeline_text: "Not sure",
      message: "Hi, looking for a 2 BHK in Sarjapur Road around 70 lakh. Please share options.",
    },
    status: "contacted",
    createdDaysAgo: 6,
    contactedDaysAgo: 1,
    followUpInDays: 1,
    followUpReason: "Call to arrange weekend site visits",
    merge: {
      daysAgo: 2,
      source: "paste",
      newMessage:
        "Hi, Pooja here again. We have finalised our budget at 80 lakh and want to move in within 3 months because of my husband's transfer. Please call me, I want to see flats this weekend.",
      updated: { budget_text: "80 lakh", timeline_text: "Within 3 months" },
    },
  },
  {
    input: {
      name: "Deepak Joshi",
      phone: "+91 90000 00011",
      email: "deepak.joshi@example.com",
      location: "Electronic City, Bengaluru",
      property_req: "1 BHK studio, rental investment",
      budget_text: "30 - 35 lakh",
      timeline_text: "Within 6 months",
      message:
        "Looking at a 1BHK in Electronic City as a rental investment. Budget 35 lakh. What rental yield can I expect? Do you have anything near the metro?",
    },
    status: "new",
    createdDaysAgo: 1,
  },
  {
    input: {
      name: "Lakshmi Venkat",
      phone: "+91 90000 00012",
      email: "lakshmi.venkat@example.com",
      location: "Hebbal, Bengaluru",
      property_req: "3 BHK apartment",
      budget_text: "1.2 Cr",
      timeline_text: "Within 2 months",
      message:
        "We have shortlisted a 3 BHK in Hebbal and are ready to book next week with the token amount. Please send the payment details and the draft agreement.",
    },
    status: "won",
    createdDaysAgo: 14,
    contactedDaysAgo: 4,
  },
];

// The first message plus the repeat enquiry, labelled the same way the merge route does it.
export function mergedMessage(lead: SeedLead, dateIST: string): string {
  if (!lead.merge) return lead.input.message;
  return `${lead.input.message}\n\n[Enquired again on ${dateIST} via ${lead.merge.source}]\n${lead.merge.newMessage}`;
}

// What the lead looks like after the merge (budget and timeline updated, message combined).
export function leadAfterMerge(lead: SeedLead, dateIST: string): LeadInput {
  if (!lead.merge) return lead.input;
  return { ...lead.input, ...lead.merge.updated, message: mergedMessage(lead, dateIST) };
}
