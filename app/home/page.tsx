import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_HOME_ID, getHome, getHomeAssets, listRepairs } from "@/lib/demo/store";

export default function HomeProfilePage() {
  const home = getHome(DEMO_HOME_ID);
  const assets = getHomeAssets(DEMO_HOME_ID);
  const repairs = listRepairs(DEMO_HOME_ID);

  return (
    <PageShell
      title="Home profile"
      description="Demo home — assets, coverage area, and recent repairs."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>City: {home?.city ?? "Islamabad"}</p>
            <p>Area: {home?.area ?? "F-10"}</p>
            <p>Address: {home?.address_text ?? "—"}</p>
            <p className="text-[var(--avero-muted)]">
              ETA heuristic: same-area verified providers usually 1–4 hours in demo data.
            </p>
          </CardContent>
        </Card>
        {assets.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{a.nickname}</CardTitle>
              <Badge variant="outline">{a.asset_type}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-[var(--avero-muted)]">
              {[a.brand, a.model].filter(Boolean).join(" · ") || "No brand on file"}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Linked repairs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {repairs.length === 0 ? (
            <p className="text-[var(--avero-muted)]">None yet</p>
          ) : (
            <ul className="list-disc pl-5">
              {repairs.map((r) => (
                <li key={r.id}>{r.title}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
