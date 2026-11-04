// POST /api/demo/reset: wipes the workspace and loads the demo leads. Only works when DEMO_RESET_ENABLED=true.

import { revalidatePath } from "next/cache";
import { errorResponse, fail, ok } from "@/lib/api";
import { resetDemoData } from "@/lib/seed";

export async function POST() {
  if (process.env.DEMO_RESET_ENABLED !== "true") {
    return fail("DEMO_DISABLED", "Resetting demo data is turned off on this server.", 403);
  }
  try {
    const seeded = await resetDemoData();
    revalidatePath("/");
    return ok({ seeded });
  } catch (err) {
    return errorResponse(err);
  }
}
