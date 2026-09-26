import { PageShell } from "@/components/page-shell";

export default function AboutIslamabadPage() {
  return (
    <PageShell
      title="Why Islamabad"
      description="Avero is built around sector-based service matching and the first-response gap residents face when something breaks at home."
    >
      <div className="space-y-8 text-[var(--avero-muted)]">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink)]">
            Sector-based service model
          </h2>
          <p className="mt-2">
            Coverage is organized around areas like F-10, G-11, I-8, E-11, Bahria, DHA,
            Bani Gala and PWD — matching how residents already describe where they live.
          </p>
        </section>
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink)]">
            Local repair categories
          </h2>
          <p className="mt-2">
            Plumbing, electrical, AC, water motor, geyser, UPS/inverter, solar and
            appliances — the trades Islamabad homes call for most often.
          </p>
        </section>
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink)]">
            The first-response gap
          </h2>
          <p className="mt-2">
            Booking platforms already exist. Avero does not claim Islamabad lacks them.
            The gap is earlier: understanding the incident, urgency, and whether DIY is
            safe before a technician is called.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
