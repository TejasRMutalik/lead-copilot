// Home page: header with a "New lead" link and an empty state. Replaced by the dashboard in Phase 4.

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Lead Copilot</h1>
        <Link href="/leads/new" className={buttonVariants()}>
          New lead
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">No leads yet. Add your first lead to get started.</p>
      </main>
    </div>
  );
}
