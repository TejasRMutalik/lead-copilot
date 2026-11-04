"use client";

// Small popover for reviewers: three lines on what the app does.

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function HowItWorks() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost">How it works</Button>} />
      <PopoverContent className="w-80 space-y-2 text-sm">
        <p>
          <span className="font-medium">1. Add leads.</span> Type one in, or paste or upload a WhatsApp chat. The AI
          reads it, scores it and suggests a reply.
        </p>
        <p>
          <span className="font-medium">2. Work them.</span> The Today panel says who to contact first. Ask the chat for
          help, and repeat enquiries are merged.
        </p>
        <p>
          <span className="font-medium">3. Log the call.</span> Type how it went. The score, follow-up date and next
          message update by themselves.
        </p>
      </PopoverContent>
    </Popover>
  );
}
