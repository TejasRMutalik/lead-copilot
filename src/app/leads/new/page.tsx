// New lead page: a Form tab (Phase 3) and a Paste tab (placeholder until Phase 6).

import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NewLeadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        Back to leads
      </Link>
      <h1 className="text-2xl font-semibold">New lead</h1>
      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="paste">Paste</TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="pt-4">
          <LeadForm />
        </TabsContent>
        <TabsContent value="paste" className="pt-4">
          <p className="text-muted-foreground">Paste intake is coming in a later phase.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
