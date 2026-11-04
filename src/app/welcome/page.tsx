// Welcome page: what Lead Copilot does, and one button to the demo. There is no sign-in; the workspace is shared.

const FEATURES = [
  {
    title: "Scores every lead",
    text: "The AI reads each enquiry and rates intent, budget, timeline and engagement. The score itself is calculated in code, so it is always explainable.",
  },
  {
    title: "Cleans up your inbox",
    text: "Paste a messy dump or upload a WhatsApp export. It becomes separate leads, and repeat enquiries are merged instead of duplicated.",
  },
  {
    title: "Prepares your next move",
    text: "Get a next action and a ready reply in the customer's own style, then ask the chat to rewrite it or help you handle an objection.",
  },
  {
    title: "Learns from every call",
    text: "Type how the call went in your own words. The score, follow-up date and next message update by themselves.",
  },
  {
    title: "Plans your day",
    text: "The Today panel lists who to contact first and why, with an opening line for each call.",
  },
];

export default function WelcomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Lead Copilot</p>
        <h1 className="text-4xl font-semibold leading-tight">Know which lead to call first, and what to say.</h1>
        <p className="text-lg text-muted-foreground">
          An assistant for real-estate salespeople that ranks inbound leads, drafts the reply and keeps every lead&apos;s
          story up to date.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="rounded-lg border bg-card p-4 sm:last:odd:col-span-2">
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        {/* A plain link on purpose: /enter sets a cookie, so it must not be prefetched. */}
        <a
          href="/enter"
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue to demo
        </a>
        <p className="text-sm text-muted-foreground">
          No sign-in needed. This is a shared demo workspace with sample leads, so anything you add can be seen by other
          visitors.
        </p>
      </div>
    </main>
  );
}
