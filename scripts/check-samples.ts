// Dev-only script: runs the real AI analysis on every sample lead and compares the tier with the one intended.
// Run with: npm run samples:check            (add names to check only some, e.g. npm run samples:check -- "Karthik Subramanian")

import { analyzeLead } from "@/lib/ai/analyze";
import { SAMPLE_LEADS } from "@/lib/sample-leads";

const WAIT_BETWEEN_CALLS_MS = 4000; // stay inside free-tier per-minute limits

async function main() {
  const only = process.argv.slice(2);
  const rows: { name: string; wanted: string; got: string; score: number; ok: string }[] = [];

  for (const { tier, fields } of SAMPLE_LEADS) {
    if (only.length > 0 && !only.includes(fields.name)) continue;
    const { score, tier: got } = await analyzeLead({ ...fields, phone: fields.phone || null, email: fields.email || null });
    rows.push({ name: fields.name, wanted: tier, got, score, ok: got === tier ? "yes" : "NO" });
    console.log(`${got === tier ? "ok  " : "MISS"} ${fields.name}: wanted ${tier}, got ${got} (${score})`);
    await new Promise((resolve) => setTimeout(resolve, WAIT_BETWEEN_CALLS_MS));
  }

  console.table(rows);
  process.exit(rows.every((row) => row.ok === "yes") ? 0 : 1);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
