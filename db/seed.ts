// Resets the database to the demo data. WARNING: deletes every lead, event and chat message first.
// Run with: npm run db:seed          (add --dry to only check the seed data without touching the database)

import { buildSeed, resetDemoData } from "@/lib/seed";

async function main() {
  if (process.argv.includes("--dry")) {
    const { leads, events } = buildSeed(new Date());
    console.table(
      leads.map((l) => ({
        name: l.input.name,
        status: l.status,
        tier: l.tier,
        score: l.score,
        follow_up: l.followUpAt?.toISOString().slice(0, 10) ?? "-",
        events: events.filter((e) => e.leadId === l.id).length,
      })),
    );
    return;
  }
  console.log(`Seeded ${await resetDemoData()} leads.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
