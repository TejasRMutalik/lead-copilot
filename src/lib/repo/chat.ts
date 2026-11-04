// Chat queries: the conversation between the salesperson and the AI about one lead.

import { sql } from "@/lib/db";
import type { ChatMessage } from "@/types";

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  const createdAt = row.created_at;
  return {
    id: row.id as string,
    lead_id: row.lead_id as string,
    role: row.role as ChatMessage["role"],
    content: row.content as string,
    created_at: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
  };
}

export async function addMessage(
  leadId: string,
  role: ChatMessage["role"],
  content: string,
): Promise<ChatMessage> {
  const rows = await sql`
    insert into chat_messages (lead_id, role, content)
    values (${leadId}, ${role}, ${content})
    returning *`;
  return rowToMessage(rows[0]);
}

// The most recent `limit` messages, returned oldest first so they read like a conversation.
export async function listMessages(leadId: string, limit: number): Promise<ChatMessage[]> {
  const rows = await sql`
    select * from (
      select * from chat_messages where lead_id = ${leadId} order by created_at desc limit ${limit}
    ) recent
    order by created_at asc`;
  return rows.map(rowToMessage);
}
