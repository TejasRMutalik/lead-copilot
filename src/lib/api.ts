// Response helpers for API routes: every route returns { ok: true, data } or { ok: false, error }.

import { NextResponse } from "next/server";
import { AiError } from "@/lib/ai/client";

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "AI_RATE_LIMIT"
  | "AI_BAD_OUTPUT"
  | "AI_UNAVAILABLE"
  | "DEMO_DISABLED"
  | "DB_ERROR";

// `warning` is optional: e.g. the lead was saved but the AI analysis failed.
export function ok<T>(data: T, warning?: ErrorCode) {
  return NextResponse.json({ ok: true, data, ...(warning ? { warning } : {}) });
}

export function fail(code: ErrorCode, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

const AI_STATUS: Record<AiError["code"], number> = {
  AI_RATE_LIMIT: 429,
  AI_BAD_OUTPUT: 502,
  AI_UNAVAILABLE: 503,
};

// Turns anything thrown inside a route into a clean error response.
export function errorResponse(err: unknown) {
  if (err instanceof AiError) return fail(err.code, err.message, AI_STATUS[err.code]);
  console.error("[api] unexpected error", err);
  return fail("DB_ERROR", "Something went wrong while saving or loading data.", 500);
}
