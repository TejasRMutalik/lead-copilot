"use client";

// Shown when a page fails to load (for example the database is unreachable), instead of a blank screen.

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        We could not load this page. This is usually a short connection problem, so trying again often works.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
