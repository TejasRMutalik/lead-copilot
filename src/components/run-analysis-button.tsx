"use client";

// Shown when a lead has no analysis (the AI failed earlier). Calls the analyze route, then refreshes the page.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RunAnalysisButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/analyze`, { method: "POST" });
      const json = await res.json();
      if (json.ok) router.refresh();
      else toast.error(json.error?.message ?? "Analysis failed. Please try again.");
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button onClick={run} disabled={running}>
      {running ? "Analyzing lead..." : "Run analysis"}
    </Button>
  );
}
