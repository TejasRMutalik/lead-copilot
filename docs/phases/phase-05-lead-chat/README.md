# Phase 5: Lead chat

Covers core requirement 3.

## Goal
On the lead page, the salesperson asks follow-up questions ("what should I emphasize on the call?", "make my reply more assertive") and gets answers grounded in that lead only.

## Build steps
1. `buildChatSystemPrompt(lead, events)` in `prompts.ts`. Context block contains:
   - All lead fields
   - Latest analysis (summary, intent, requirements, objections, next action, suggested response)
   - Last 5 timeline events in short form (debrief notes, merges, status changes)
   - Rules: answer only about this lead; use the customer's own details; be short (under 120 words unless asked to rewrite); when rewriting a message, return only the message; if asked something unrelated to this lead or sales, say so in one line and steer back; never invent prices, projects or facts not in the context; say "not in the lead info, ask the customer" when unsure.
2. `POST /api/leads/[id]/chat`: validate `{ message }` (1 to 1,000 chars), load lead, events, last 10 chat messages, call `generateText`, save both user and assistant messages, return reply.
3. `components/lead-chat.tsx`: message list + input. Quick-prompt chips above the input:
   - "What should I emphasize on the call?"
   - "Handle their main objection"
   - "Make my reply more assertive"
   - "Write a follow-up for tomorrow"
   - Assistant messages that look like a draft get a Copy button.
4. Place chat in the right column of the lead page.

## Done when
- [ ] Answers mention this lead's specific budget, location or objection
- [ ] "Make my reply more assertive" returns a rewritten version of the current suggested response
- [ ] "What's the capital of France?" gets a polite one-line redirect
- [ ] Chat history persists after refresh

## Interview talking point
"Grounding is simple and explicit: every chat call carries the lead record, latest analysis and recent timeline. No vector database needed, because one lead fits easily in the prompt."
