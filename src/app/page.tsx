// Home page: header, a spot for the Today panel (Phase 9), filters, and the ranked lead list.

import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { LeadFilters } from "@/components/lead-filters";
import { LeadList } from "@/components/lead-list";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listLeads } from "@/lib/repo/leads";
import { ListQuerySchema } from "@/lib/validation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Reads the database, so it sits inside Suspense on the page below.
async function Leads({ searchParams }: { searchParams: SearchParams }) {
  // "Today" and the database change per request, so wait for a real request before using them.
  await connection();
  const raw = await searchParams;
  // Bad or repeated query values are ignored instead of causing an error.
  const parsed = ListQuerySchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};
  const leads = await listLeads(filters);
  const filtered = Boolean(filters.tier || filters.status || filters.q);
  return <LeadList leads={leads} filtered={filtered} />;
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold">Lead Copilot</h1>
        <Link href="/leads/new" className={buttonVariants()}>
          New lead
        </Link>
      </header>
      <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
        {/* Today panel goes here in Phase 9. */}
        <Suspense fallback={<Skeleton className="h-8 w-full" />}>
          <LeadFilters />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Leads searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
