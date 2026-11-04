// GET /api/briefing: today's plan of who to contact first. Add ?refresh=1 to build a new one.

import { errorResponse, ok } from "@/lib/api";
import { getTodayBriefing } from "@/lib/briefing";
import { ensureDemoData } from "@/lib/seed";

export const maxDuration = 60;

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    await ensureDemoData(); // the panel can load before the list does, so it checks too
    return ok(await getTodayBriefing(refresh));
  } catch (err) {
    return errorResponse(err);
  }
}
