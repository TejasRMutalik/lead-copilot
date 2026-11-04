// Lead detail page: analysis on the left, chat on the right, timeline at the bottom.

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AnalysisPanel } from "@/components/analysis-panel";
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { StatusSelect } from "@/components/status-select";
import { Timeline } from "@/components/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadChat } from "@/components/lead-chat";
import { listMessages } from "@/lib/repo/chat";
import { listEvents } from "@/lib/repo/events";
import { getLead } from "@/lib/repo/leads";
import { isUuid } from "@/lib/validation";

// Reads the lead from the database, so it sits inside Suspense on the page below.
async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  // The timeline shows times relative to today, so wait for a real request first.
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const lead = await getLead(id);
  if (!lead) notFound();
  const [events, messages] = await Promise.all([listEvents(id), listMessages(id, 50)]);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {lead.analysis ? (
            <AnalysisPanel lead={lead} analysis={lead.analysis} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold">{lead.name}</h1>
                <StatusSelect leadId={lead.id} status={lead.status} />
              </div>
              <p className="text-muted-foreground">
                This lead was saved, but it has not been analyzed yet.
              </p>
              <RunAnalysisButton leadId={lead.id} />
            </div>
          )}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadChat leadId={lead.id} initialMessages={messages} analyzed={lead.analysis !== null} />
          </CardContent>
        </Card>
      </div>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <Timeline events={events} />
      </section>
    </>
  );
}

export default function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        Back to leads
      </Link>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LeadDetail params={params} />
      </Suspense>
    </div>
  );
}
