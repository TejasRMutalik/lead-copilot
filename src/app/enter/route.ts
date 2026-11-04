// GET /enter: remembers that the visitor has seen the welcome page, then opens the dashboard. There is no real login.

import { NextResponse } from "next/server";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("welcome_seen", "1", { path: "/", maxAge: ONE_YEAR_SECONDS, sameSite: "lax" });
  return response;
}
