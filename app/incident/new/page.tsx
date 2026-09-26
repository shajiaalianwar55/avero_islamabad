import { PageShell } from "@/components/page-shell";
import { IncidentForm } from "@/components/triage/incident-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewIncidentPage() {
  return (
    <PageShell
      title="Report a home problem"
      description="Describe what is happening in Islamabad. Avero will ask follow-ups and check for danger."
    >
      <Card>
        <CardHeader>
          <CardTitle>Incident intake</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentForm />
        </CardContent>
      </Card>
    </PageShell>
  );
}
