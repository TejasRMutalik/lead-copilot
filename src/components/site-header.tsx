// Header on every page: app name, how-it-works help, reset (only when the demo is enabled) and New lead.

import Link from "next/link";
import { HowItWorks } from "@/components/how-it-works";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  const canReset = process.env.DEMO_RESET_ENABLED === "true";

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
      <Link href="/" className="text-xl font-semibold">
        Lead Copilot
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <HowItWorks />
        {canReset && <ResetDemoButton />}
        <Link href="/leads/new" className={buttonVariants()}>
          New lead
        </Link>
      </div>
    </header>
  );
}
