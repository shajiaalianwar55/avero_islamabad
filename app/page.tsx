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
        <div className="relative mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-20 md:min-h-[70vh] md:justify-end md:pb-20 md:pt-24">
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
            Tell us what failed. Pick the appliance. Answer a few questions. Avero chooses
            safe DIY, a technician, or emergency — then helps you finish the job.
          </p>

          <Link
            href="/incident/new"
            className="mt-10 block w-full max-w-2xl rounded-2xl border-2 border-[var(--avero-teal)] bg-[var(--avero-panel)] px-6 py-10 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--avero-teal)]">
              Start here
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--avero-ink)] md:text-4xl">
              Tell us about the problem
            </p>
            <p className="mt-3 text-[var(--avero-muted)]">
              Pick an appliance and answer short questions — or switch to Talk mode and
              speak with Avero.
            </p>
            <p className="mt-6 text-base font-semibold text-[var(--avero-teal)]">
              Begin →
            </p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" id="how">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Tell Avero what happened",
              body: "Describe the problem in your own words and choose the appliance or area involved.",
            },
            {
              title: "Avero investigates",
              body: "Avero asks adaptive questions to narrow down the cause, check for safety risks, and understand what should happen next.",
            },
            {
              title: "Take the right next step",
              body: "Get guided DIY help, book the right technician, or receive immediate safety guidance if the issue is urgent.",
            },
          ].map((step, i) => (
            <li
              key={step.title}
              className="rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4"
            >
              <span className="font-semibold text-[var(--avero-teal)]">
                Step {i + 1}: {step.title}
              </span>
              <p className="mt-2 text-[var(--avero-ink)]">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link href="/incident/new">
            <Button size="lg">Report a problem</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
