import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/about-islamabad", label: "Why Islamabad" },
  { href: "/app", label: "Resident" },
  { href: "/provider", label: "Provider" },
  { href: "/history", label: "History" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--avero-border)] bg-[var(--avero-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--avero-ink)]">
          Avero
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--avero-ink-muted)]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[var(--avero-ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
