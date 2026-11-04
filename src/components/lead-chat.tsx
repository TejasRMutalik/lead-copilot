"use client";

// Chat box on the lead page: quick-prompt chips, message list and an input. Talks to /api/leads/[id]/chat.

import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/types";

const QUICK_PROMPTS = [
  "What should I emphasize on the call?",
  "Handle their main objection",
  "Make my reply more assertive",
  "Write a follow-up for tomorrow",
];

// An assistant answer is treated as a draft message when the question asked for writing.
const DRAFT_REQUEST = /write|rewrite|reply|message|follow-up|follow up|assertive|draft|polite|shorter/i;

export function LeadChat({
  leadId,
  initialMessages,
  analyzed,
}: {
  leadId: string;
  initialMessages: ChatMessage[];
  analyzed: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [failedText, setFailedText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, failedText]);

  async function send(text: string, alreadyShown = false) {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setFailedText(null);
    setInput("");
    if (!alreadyShown) {
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, lead_id: leadId, role: "user", content: message, created_at: "" },
      ]);
    }
    try {
      const res = await fetch(`/api/leads/${leadId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (json.ok) setMessages((prev) => [...prev, json.data.message]);
      else setFailedText(message);
    } catch {
      setFailedText(message);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a new line.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="space-y-3">
      {!analyzed && (
        <p className="text-xs text-muted-foreground">Run analysis for better answers.</p>
      )}
      {messages.length === 0 && !sending && (
        <p className="text-sm text-muted-foreground">Pick a quick prompt or type a question below.</p>
      )}
      <div
        className={
          messages.length === 0 && !sending && !failedText
            ? "hidden"
            : "max-h-80 space-y-3 overflow-y-auto rounded-md border p-3"
        }
      >
        {messages.map((m, i) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {m.content}
            </div>
            {m.role === "assistant" && DRAFT_REQUEST.test(messages[i - 1]?.content ?? "") && (
              <div className="mt-1">
                <CopyButton text={m.content} />
              </div>
            )}
          </div>
        ))}
        {sending && <p className="text-sm text-muted-foreground">Thinking...</p>}
        {failedText && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            Couldn&apos;t answer.
            <Button type="button" variant="outline" size="sm" onClick={() => send(failedText, true)}>
              Retry
            </Button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="outline"
            size="sm"
            disabled={sending}
            onClick={() => send(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={1000}
          rows={2}
          placeholder="Ask about this lead..."
        />
        <Button type="button" disabled={sending || !input.trim()} onClick={() => send(input)}>
          Send
        </Button>
      </div>
    </div>
  );
}
