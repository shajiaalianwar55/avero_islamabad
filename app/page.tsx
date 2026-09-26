import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--avero-line)]">
        <div
          className="absolute inset-0 bg-[url('/hero-texture.svg')] bg-cover bg-center opacity-40"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--avero-teal)]">
            Built for homes in Islamabad
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] text-[var(--avero-ink)] md:text-7xl">
            Avero
          </h1>
          <p className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink-soft)] md:text-3xl">
            Something broke at home? Know what to do next.
          </p>
          <p className="mt-4 max-w-xl text-lg text-[var(--avero-muted)]">
            Avero asks the right questions, checks for safety risks, guides simple
            repairs, and connects Islamabad residents to the right professional when
            needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/incident/new">
              <Button size="lg">Check a home problem</Button>
            </Link>
            <Link href="/#how">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="problem">
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">
          Something broke. What now?
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--avero-muted)]">
          The hard part is often not finding a technician. It is knowing whether you
          need one.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            "Can I safely fix this myself?",
            "Which technician do I actually need?",
            "Is this dangerous enough to stop and get help now?",
          ].map((item) => (
            <div
              key={item}
              className="border-t-2 border-[var(--avero-teal)] pt-4 text-lg text-[var(--avero-ink)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--avero-line)] bg-[var(--avero-panel)]/70 py-16" id="paths">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
          {[
            {
              title: "DIY",
              body: "Safe, one-step guidance when the risk is low and tools are simple.",
            },
            {
              title: "Technician",
              body: "Structured service requests matched to Islamabad trades and areas.",
            },
            {
              title: "Emergency",
              body: "Hard safety stop with conservative actions — no risky repair steps.",
            },
          ].map((card) => (
            <div key={card.title}>
              <h3 className="font-[family-name:var(--font-display)] text-2xl">{card.title}</h3>
              <p className="mt-2 text-[var(--avero-muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="how">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">How Avero works</h2>
        <ol className="mt-6 space-y-3 text-[var(--avero-muted)]">
          <li>1. Report what you notice in plain language.</li>
          <li>2. Answer adaptive follow-up questions — one at a time.</li>
          <li>3. Safety gate checks for danger after every message.</li>
          <li>4. Get a clear DIY, technician, or emergency path.</li>
          <li>5. Compare offers, book with protected payment state, and keep Home History.</li>
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="islamabad">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Why Islamabad</h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--avero-muted)]">
          Islamabad has an active home-services market, but the repair journey is still
          fragmented. Residents may begin with referrals, calls, WhatsApp messages or
          service platforms, while the first decision remains the same: what is actually
          wrong and what should happen next? Avero is designed around that first-response
          gap, then carries the issue through repair and history.
        </p>
      </section>

      <section className="border-t border-[var(--avero-line)] bg-[var(--avero-ink)] px-4 py-16 text-[var(--avero-cream)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl">
              When something breaks, know what to do next.
            </h2>
            <p className="mt-2 text-[var(--avero-sand)]">
              Payment protection and Home History are built into the coordination loop.
            </p>
          </div>
          <Link href="/app">
            <Button size="lg" variant="secondary">
              Continue as Demo Resident
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
