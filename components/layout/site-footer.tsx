import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--avero-border)] bg-[var(--avero-surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-[var(--avero-ink-muted)] md:flex-row md:items-center md:justify-between">
        <p>Avero — AI home incident first responder for Islamabad.</p>
        <p>
          Not a substitute for emergency services.{" "}
          <Link href="/about-islamabad" className="underline hover:text-[var(--avero-ink)]">
            City notes
          </Link>
        </p>
      </div>
    </footer>
  );
}
