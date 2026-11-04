// Applies db/schema.sql to DATABASE_URL. Safe to run any number of times.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set. Add it to .env.local");

  const sql = neon(url);
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");

  // The HTTP driver runs one statement at a time, so split on semicolons.
  const statements = schema
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`Schema applied (${statements.length} statements).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
