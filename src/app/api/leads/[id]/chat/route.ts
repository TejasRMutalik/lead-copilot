// POST /api/leads/[id]/chat: answer a follow-up question about one lead, using only that lead's data.

import { errorResponse, fail, ok } from "@/lib/api";
import { generateText, type ChatTurn } from "@/lib/ai/client";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { addMessage, listMessages } from "@/lib/repo/chat";
import { listEvents } from "@/lib/repo/events";
import { getLead } from "@/lib/repo/leads";
import { ChatBodySchema, describeIssues, isUuid } from "@/lib/validation";

export const maxDuration = 60;

// The model is told to avoid markdown; this removes any that slips through.
function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^#{1,6}\s+/gm, "").trim();
}

// Models expect the conversation to start with the user and alternate. A failed earlier
// attempt can leave two user messages in a row, so join those into one turn.
function toTurns(messages: { role: "user" | "assistant"; content: string }[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) last.content += `\n${m.content}`;
    else if (last || m.role === "user") turns.push({ role: m.role, content: m.content });
  }
  return turns;
}

export async function POST(request: Request, ctx: RouteContext<"/api/leads/[id]/chat">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("NOT_FOUND", "Lead not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION", "Request body must be JSON.");
  }
  const parsed = ChatBodySchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", describeIssues(parsed.error));
  const { message } = parsed.data;

  try {
    const lead = await getLead(id);
    if (!lead) return fail("NOT_FOUND", "Lead not found.", 404);

    // Save the question first so it is not lost if the AI fails. A retry of the same
    // question (last saved message is the same unanswered user message) is not saved twice.
    const before = await listMessages(id, 1);
    const last = before[0];
    if (!(last && last.role === "user" && last.content === message)) {
      await addMessage(id, "user", message);
    }

    const [events, history] = await Promise.all([listEvents(id), listMessages(id, 10)]);
    const { text } = await generateText({
      system: buildChatSystemPrompt(lead, events),
      messages: toTurns(history),
    });

    const reply = stripMarkdown(text);
    const saved = await addMessage(id, "assistant", reply);
    return ok({ reply, message: saved });
  } catch (err) {
    return errorResponse(err);
  }
}
