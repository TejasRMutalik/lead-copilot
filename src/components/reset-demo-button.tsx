"use client";

// "Reset demo" button with a confirm dialog. Calls POST /api/demo/reset, then shows the home page with fresh data.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Sent after a reset so the Today panel (which loads its own data) knows to reload.
export const RESET_EVENT = "demo-reset";

export function ResetDemoButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function reset() {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Demo data reset: ${json.data.seeded} leads loaded.`);
        window.dispatchEvent(new Event(RESET_EVENT)); // tells the Today panel to load a new plan
        setOpen(false);
        setResetting(false);
        router.push("/");
        router.refresh();
        return;
      }
      toast.error(json.error?.message ?? "Could not reset the demo data.");
    } catch {
      toast.error("Could not reach the server. Please try again.");
    }
    setResetting(false);
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !resetting && setOpen(next)}>
      <AlertDialogTrigger render={<Button variant="outline">Reset demo</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes every lead, timeline and chat in this workspace and loads the sample leads again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={resetting} onClick={reset}>
            {resetting ? "Resetting..." : "Reset"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
