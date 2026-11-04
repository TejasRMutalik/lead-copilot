// Sends first-time visitors from the dashboard to the welcome page. The "welcome_seen" cookie is set by /enter.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.cookies.has("welcome_seen")) return NextResponse.next();
  return NextResponse.redirect(new URL("/welcome", request.url));
}

// Only the dashboard. Direct links to a lead, API routes and assets are never redirected.
export const config = { matcher: "/" };
