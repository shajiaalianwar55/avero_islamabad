"use client";

import Link from "next/link";
import { LanguageProvider, LanguageToggle } from "@/components/i18n/language-toggle";

const links = [
  { href: "/app", label: "Resident" },
  { href: "/provider", label: "Provider" },
  { href: "/history", label: "History" },
  { href: "/about-islamabad", label: "Islamabad" },
];

export function SiteHeader() {
  return (
    <LanguageProvider>
      <header className="border-b border-[var(--avero-line)] bg-[var(--avero-cream)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--avero-ink)]"
          >
            Avero
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--avero-muted)] transition-colors hover:text-[var(--avero-ink)]"
              >
                {link.label}
              </Link>
            ))}
            <LanguageToggle />
            <Link
              href="/#start-demo"
              className="rounded-md bg-[var(--avero-teal)] px-3 py-1.5 font-medium text-white hover:bg-[var(--avero-teal)]/90 hover:text-white"
            >
              Start demo
            </Link>
          </nav>
        </div>
      </header>
    </LanguageProvider>
  );
}
