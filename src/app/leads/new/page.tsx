// New lead page: a Form tab for one lead and a Paste tab for a messy dump of many.

import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { PasteIntake } from "@/components/paste-intake";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NewLeadPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
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
          <PasteIntake />
        </TabsContent>
      </Tabs>
    </div>
  );
}
