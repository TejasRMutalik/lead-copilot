// Made-up leads for the "Fill sample" button: 5 hot, 5 warm and 5 cold. The tier is what the analysis should
// give each one (checked with `npm run samples:check`). Phones and emails are fake and match no demo lead.

import type { Tier } from "@/types";

export type SampleFields = {
  name: string;
  phone: string;
  email: string;
  location: string;
  property_req: string;
  budget_text: string;
  timeline_text: string;
  message: string;
};

export const SAMPLE_LEADS: { tier: Tier; fields: SampleFields }[] = [
  // ---- Hot: clear need, realistic budget, urgent, details given ----
  {
    tier: "hot",
    fields: {
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
  },
  {
    tier: "hot",
    fields: {
      name: "Farhan Ali",
      phone: "+91 99000 11002",
      email: "",
      location: "Electronic City, Bengaluru",
      property_req: "2 BHK flat, quick possession",
      budget_text: "55 - 60 lakh",
      timeline_text: "Next month",
      message:
        "Bhai, Electronic City mein 2BHK chahiye, budget 55-60 lakh. Possession jaldi chahiye, next month tak. Loan ho jayega. Kab call kar sakte ho?",
    },
  },
  {
    tier: "hot",
    fields: {
      name: "Suresh Patil",
      phone: "+91 99000 11003",
      email: "suresh.patil@example.com",
      location: "Yelahanka, Bengaluru",
      property_req: "30x40 residential plot, BDA approved",
      budget_text: "85 - 95 lakh",
      timeline_text: "Within 3 months",
      message:
        "I want to buy a 30x40 plot in Yelahanka to build my own house. BDA approved only, clear title. Budget up to 95 lakh, ready to pay a token this month if the papers are clean.",
    },
  },
  {
    tier: "hot",
    fields: {
      name: "Anjali Deshmukh",
      phone: "+91 99000 11004",
      email: "anjali.deshmukh@example.com",
      location: "Hebbal, Bengaluru",
      property_req: "3 BHK apartment, ready to move",
      budget_text: "1.1 Cr",
      timeline_text: "Within 3 weeks",
      message:
        "We have sold our old flat and the funds are ready. We want to finalise a 3 BHK in Hebbal within 3 weeks. I can visit tomorrow evening with my husband. Please share your best 2 options.",
    },
  },
  {
    tier: "hot",
    fields: {
      name: "Rahul Bansal",
      phone: "+91 99000 11005",
      email: "rahul.bansal@example.com",
      location: "Sarjapur Road, Bengaluru",
      property_req: "3 BHK villa in a gated community",
      budget_text: "2.2 Cr",
      timeline_text: "Next month",
      message:
        "I am relocating from Delhi next month and will pay by cheque, no loan needed. I want a 3 BHK villa on Sarjapur Road and plan to book after one visit this Saturday. Please confirm timings.",
    },
  },

  // ---- Warm: real interest, but later, flexible or still comparing ----
  {
    tier: "warm",
    fields: {
      name: "Karthik Subramanian",
      phone: "+91 99000 11006",
      email: "karthik.s@example.com",
      location: "Sarjapur Road, Bengaluru",
      property_req: "2 BHK apartment in a gated community",
      budget_text: "Around 80 lakh",
      timeline_text: "A few months, not sure",
      message:
        "Hi, I am looking for a 2 BHK on Sarjapur Road, budget around 80 lakh. Not sure about timing yet, probably a few months. Can you share what you have?",
    },
  },
  {
    tier: "warm",
    fields: {
      name: "Divya Menon",
      phone: "+91 99000 11007",
      email: "divya.menon@example.com",
      location: "Hebbal, Bengaluru",
      property_req: "3 BHK near the Outer Ring Road",
      budget_text: "Around 1 Cr, not fixed",
      timeline_text: "Maybe next year",
      message:
        "Hi, we are planning a 3 BHK in Hebbal, maybe next year. Budget is around 1 Cr but nothing is fixed. Can you share what you have?",
    },
  },
  {
    tier: "warm",
    fields: {
      name: "Aisha Rahman",
      phone: "+91 99000 11008",
      email: "aisha.rahman@example.com",
      location: "HSR Layout, Bengaluru",
      property_req: "1 BHK flat for rent, furnished",
      budget_text: "Around 25k per month",
      timeline_text: "Not sure",
      message:
        "Hi, do you have any 1 BHK for rent in HSR Layout? I may move at some point, not sure when.",
    },
  },
  {
    tier: "warm",
    fields: {
      name: "Manoj Pillai",
      phone: "+91 99000 11009",
      email: "",
      location: "Whitefield, Bengaluru",
      property_req: "2 BHK apartment",
      budget_text: "Maybe 70 - 80 lakh",
      timeline_text: "Not decided",
      message:
        "Hello, thinking of a 2 BHK in Whitefield at some point. Still comparing areas. What are your prices roughly?",
    },
  },
  {
    tier: "warm",
    fields: {
      name: "Preeti Kapoor",
      phone: "+91 99000 11010",
      email: "preeti.kapoor@example.com",
      location: "Electronic City, Bengaluru",
      property_req: "1 BHK studio for rental income",
      budget_text: "30 - 35 lakh",
      timeline_text: "Not immediate",
      message:
        "Hi, I am looking at small flats in Electronic City for rental income, around 30-35 lakh. Not planning anything immediately. What rent can I expect?",
    },
  },

  // ---- Cold: vague, unrealistic, or not a buyer yet ----
  {
    tier: "cold",
    fields: {
      name: "Ananya Das",
      phone: "+91 99000 11011",
      email: "ananya.das@example.com",
      location: "Bengaluru",
      property_req: "Not decided yet",
      budget_text: "Not sure",
      timeline_text: "Maybe next year",
      message: "Hi, just looking around for now. Might buy something next year. Can you send me some details?",
    },
  },
  {
    tier: "cold",
    fields: {
      name: "Gaurav Kumar",
      phone: "+91 99000 11012",
      email: "",
      location: "Bengaluru",
      property_req: "2 BHK",
      budget_text: "Not sure",
      timeline_text: "Not sure",
      message: "Hi price of 2bhk?",
    },
  },
  {
    tier: "cold",
    fields: {
      name: "Tina Fernandes",
      phone: "+91 99000 11013",
      email: "tina.fernandes@example.com",
      location: "Indiranagar, Bengaluru",
      property_req: "3 BHK apartment",
      budget_text: "25 lakh",
      timeline_text: "Not sure",
      message:
        "What is the cheapest 3 BHK you have in Indiranagar? I only have around 25 lakh. Just checking, not sure when I will buy.",
    },
  },
  {
    tier: "cold",
    fields: {
      name: "Vivek Anand",
      phone: "+91 99000 11014",
      email: "",
      location: "Bengaluru",
      property_req: "Any apartment",
      budget_text: "No idea",
      timeline_text: "Maybe in 2 years",
      message: "Just checking the rates for my friend. He may buy something in a couple of years, nothing fixed yet.",
    },
  },
  {
    tier: "cold",
    fields: {
      name: "Sunita Rao",
      phone: "+91 99000 11015",
      email: "sunita.rao@example.com",
      location: "Bengaluru",
      property_req: "Not sure",
      budget_text: "Husband will decide",
      timeline_text: "No hurry",
      message:
        "Saw your ad and I am forwarding this to my husband, he will decide. We are not in a hurry, maybe after a year or two. Please do not call.",
    },
  },
];
