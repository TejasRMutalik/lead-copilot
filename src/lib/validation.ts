// Zod schemas for request bodies. The lead form also uses LeadInputSchema, so browser and server check the same rules.

import { z } from "zod";

const required = (max = 300) => z.string().trim().min(1, "Required").max(max, `Max ${max} characters`);

// Optional text: an empty string counts as "not provided".
const optionalText = z
  .string()
  .trim()
  .max(300, "Max 300 characters")
  .transform((value) => value || undefined)
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .max(300, "Max 300 characters")
  .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email")
  .transform((value) => value || undefined)
  .optional();

export const MESSAGE_MAX = 6000;

export const LeadInputSchema = z.object({
  name: required(),
  phone: optionalText,
  email: optionalEmail,
  location: required(),
  property_req: required(),
  budget_text: required(),
  timeline_text: required(),
  message: required(MESSAGE_MAX),
});

// Body of POST /api/leads.
export const CreateLeadSchema = LeadInputSchema.extend({
  source: z.enum(["form", "paste"]).default("form"),
  skipDuplicateCheck: z.boolean().optional(), // used in Phase 7
});

export const TierSchema = z.enum(["hot", "warm", "cold"]);
export const StatusSchema = z.enum(["new", "contacted", "negotiating", "won", "lost"]);

// Query string of GET /api/leads. Empty values are treated as "no filter".
export const ListQuerySchema = z.object({
  tier: TierSchema.optional(),
  status: StatusSchema.optional(),
  q: z.string().trim().max(100).optional(),
});

// Body of PATCH /api/leads/[id].
export const StatusUpdateSchema = z.object({ status: StatusSchema });

// Body of POST /api/leads/[id]/chat.
export const ChatBodySchema = z.object({ message: z.string().trim().min(1).max(1000) });

export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

// One readable line for API error messages, e.g. "name: Required; email: Enter a valid email".
export function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
}
