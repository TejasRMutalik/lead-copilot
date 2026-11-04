// Home page: a simple header and an empty state. Replaced by the dashboard in Phase 4.

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Lead Copilot</h1>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">No leads yet. Add your first lead to get started.</p>
      </main>
    </div>
  );
}
