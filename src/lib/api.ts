// Response helpers for API routes: every route returns { ok: true, data } or { ok: false, error }.

import { NextResponse } from "next/server";

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "AI_RATE_LIMIT"
  | "AI_BAD_OUTPUT"
  | "AI_UNAVAILABLE"
  | "DB_ERROR";

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function fail(code: ErrorCode, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}
