// Right column of the lead page: Call debrief and Chat in tabs. Stays in view on wide screens while the left side scrolls.

import { DebriefForm } from "@/components/debrief-form";
import { LeadChat } from "@/components/lead-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChatMessage } from "@/types";

export function LeadWorkspace({
  leadId,
  messages,
  analyzed,
}: {
  leadId: string;
  messages: ChatMessage[];
  analyzed: boolean;
}) {
  return (
    // id="debrief" is the target of the "Mark done" link in the Today panel.
    <Card id="debrief" className="h-fit lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <CardContent>
        <Tabs defaultValue="debrief">
          <TabsList className="w-full">
            <TabsTrigger value="debrief">Call debrief</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          {/* keepMounted: switching tabs must not throw away typed notes or the chat history on screen. */}
          <TabsContent value="debrief" keepMounted className="space-y-2 pt-3">
            <p className="text-sm font-medium">How did the call go?</p>
            <DebriefForm leadId={leadId} />
          </TabsContent>
          <TabsContent value="chat" keepMounted className="pt-3">
            <LeadChat leadId={leadId} initialMessages={messages} analyzed={analyzed} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
