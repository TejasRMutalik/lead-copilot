// Temporary health check: runs "select 1" to prove the app can reach the database. Remove in Phase 10.

import { fail, ok } from "@/lib/api";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql`select 1`;
    return ok({ db: "up" });
  } catch {
    return fail("DB_ERROR", "Could not reach the database", 500);
  }
}
