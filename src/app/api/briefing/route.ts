// GET /api/briefing: today's plan of who to contact first. Add ?refresh=1 to build a new one.

import { errorResponse, ok } from "@/lib/api";
import { getTodayBriefing } from "@/lib/briefing";

export const maxDuration = 60;

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    return ok(await getTodayBriefing(refresh));
  } catch (err) {
    return errorResponse(err);
  }
}
