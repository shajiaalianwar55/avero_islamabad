import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoScenarioCards } from "@/components/demo/demo-scenario-cards";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--avero-line)]">
        <div
          className="absolute inset-0 bg-[url('/hero-texture.svg')] bg-cover bg-center opacity-40"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-12 pt-20 md:min-h-[52vh] md:pb-16 md:pt-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--avero-teal)]">
            Built for homes in Islamabad
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] text-[var(--avero-ink)] md:text-6xl">
            Avero
          </h1>
          <p className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink-soft)] md:text-3xl">
            Something broke at home? Know what to do next.
          </p>
          <p className="mt-4 max-w-xl text-lg text-[var(--avero-muted)]">
            AI triage checks safety, guides safe DIY, and coordinates a technician when
            you need one — then saves the repair in Home History.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#start-demo">
              <Button size="lg">Start guided demo</Button>
            </a>
            <Link href="/incident/new">
              <Button size="lg" variant="outline">
                Report a problem yourself
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section
        id="start-demo"
        className="border-b border-[var(--avero-line)] bg-[var(--avero-panel)]/80 py-14"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            Pick a path — 3 minutes
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--avero-muted)]">
            Click one card. Avero walks you through questions, the decision, and the next
            step. No setup required.
          </p>
          <div className="mt-8">
            <DemoScenarioCards />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" id="how">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">How the demo flows</h2>
        <ol className="mt-6 grid gap-4 text-[var(--avero-muted)] md:grid-cols-3">
          {[
            "Answer a couple of questions (tap the chips — no typing needed).",
            "See DIY, Technician, or Emergency with clear evidence.",
            "For technician: compare offers, book, confirm, open Home History.",
          ].map((step, i) => (
            <li
              key={step}
              className="rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4"
            >
              <span className="font-semibold text-[var(--avero-teal)]">Step {i + 1}</span>
              <p className="mt-2 text-[var(--avero-ink)]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[var(--avero-line)] bg-[var(--avero-ink)] px-4 py-12 text-[var(--avero-cream)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[var(--avero-sand)]">
            Islamabad sectors · safety gate · protected payment demo · Home History
          </p>
          <a href="#start-demo">
            <Button size="lg" variant="secondary">
              Back to demos
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
