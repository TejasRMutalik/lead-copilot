// Dev-only script: runs the real AI analysis once for every demo lead and saves the results to
// src/lib/seed-analyses.json, so resetting the demo costs zero AI calls. Existing entries are kept.
// Run with: npm run seed:gen   (add --force to redo everything)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeLead } from "@/lib/ai/analyze";
import { todayIST } from "@/lib/dates";
import { SEED_LEADS, leadAfterMerge } from "@/lib/seed-data";
import type { LeadAnalysis } from "@/types";

const FILE = join(process.cwd(), "src", "lib", "seed-analyses.json");
const WAIT_BETWEEN_CALLS_MS = 4000; // stay inside free-tier per-minute limits

async function main() {
  const force = process.argv.includes("--force");
  const saved: Record<string, LeadAnalysis> = !force && existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
  const today = todayIST();

  for (const lead of SEED_LEADS) {
    // A merged lead needs two analyses: one before the repeat enquiry and one after.
    const jobs = [{ key: lead.input.name, input: leadAfterMerge(lead, today) }];
    if (lead.merge) jobs.unshift({ key: `${lead.input.name}#before`, input: lead.input });

    for (const { key, input } of jobs) {
      if (saved[key]) {
        console.log(`skip    ${key}`);
        continue;
      }
      const { analysis, score, tier } = await analyzeLead(input);
      saved[key] = analysis;
      writeFileSync(FILE, JSON.stringify(saved, null, 2) + "\n"); // save after each lead, so a failure loses nothing
      console.log(`done    ${key} -> ${tier} ${score}`);
      await new Promise((resolve) => setTimeout(resolve, WAIT_BETWEEN_CALLS_MS));
    }
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
