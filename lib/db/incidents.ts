import { env, hasSupabaseConfig } from "@/lib/env";
import * as demo from "@/lib/demo/store";
import type {
  DiyPlanRow,
  DiyStepRow,
  Incident,
  IncidentMessage,
  SafetyAssessmentRow,
  ServiceRequestRow,
  TriageDecisionRow,
} from "@/types/db";
import type { IncidentStatus } from "@/types";

export function shouldUseDemoStore(): boolean {
  if (env.NEXT_PUBLIC_DEMO_MODE) return true;
  if (!hasSupabaseConfig() || !env.SUPABASE_SERVICE_ROLE_KEY) return true;
  return false;
}

async function getAdmin() {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  return createServiceClient();
}

export async function createIncident(input: {
  home_id?: string;
  asset_id?: string | null;
  initial_description: string;
  category_guess?: string | null;
}): Promise<Incident> {
  if (shouldUseDemoStore()) {
    return demo.createIncident(input);
  }

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("incidents")
      .insert({
        home_id: input.home_id ?? demo.DEMO_HOME_ID,
        asset_id: input.asset_id ?? null,
        initial_description: input.initial_description,
        category_guess: input.category_guess ?? null,
        status: "TRIAGE",
      })
      .select()
      .single();
    if (error) throw error;
    return data as Incident;
  } catch {
    return demo.createIncident(input);
  }
}

export async function getIncident(id: string): Promise<Incident | null> {
  if (shouldUseDemoStore()) return demo.getIncident(id) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Incident) ?? null;
  } catch {
    return demo.getIncident(id) ?? null;
  }
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  resolvedAt?: string | null
): Promise<Incident | null> {
  if (shouldUseDemoStore()) {
    return demo.updateIncidentStatus(id, status, resolvedAt);
  }

  try {
    const supabase = await getAdmin();
    const patch: Record<string, unknown> = { status };
    if (resolvedAt !== undefined) patch.resolved_at = resolvedAt;
    if (status === "RESOLVED" || status === "CLOSED") {
      patch.resolved_at = resolvedAt ?? new Date().toISOString();
    }
    const { data, error } = await supabase
      .from("incidents")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Incident;
  } catch {
    return demo.updateIncidentStatus(id, status, resolvedAt);
  }
}

export async function addMessage(input: {
  incident_id: string;
  role: IncidentMessage["role"];
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<IncidentMessage> {
  if (shouldUseDemoStore()) return demo.createMessage(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("incident_messages")
      .insert({
        incident_id: input.incident_id,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as IncidentMessage;
  } catch {
    return demo.createMessage(input);
  }
}

export async function listMessages(
  incidentId: string
): Promise<IncidentMessage[]> {
  if (shouldUseDemoStore()) return demo.listMessages(incidentId);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("incident_messages")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as IncidentMessage[]) ?? [];
  } catch {
    return demo.listMessages(incidentId);
  }
}

export async function saveSafetyAssessment(
  input: Omit<SafetyAssessmentRow, "id" | "created_at">
): Promise<SafetyAssessmentRow> {
  if (shouldUseDemoStore()) return demo.createSafetyAssessment(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("safety_assessments")
      .insert({
        incident_id: input.incident_id,
        level: input.level,
        hazard_codes: input.hazard_codes,
        stop_troubleshooting: input.stop_troubleshooting,
        safe_actions: input.safe_actions,
        prohibited_actions: input.prohibited_actions,
      })
      .select()
      .single();
    if (error) throw error;
    return data as SafetyAssessmentRow;
  } catch {
    return demo.createSafetyAssessment(input);
  }
}

export async function saveTriageDecision(
  input: Omit<TriageDecisionRow, "id" | "created_at">
): Promise<TriageDecisionRow> {
  if (shouldUseDemoStore()) return demo.createTriageDecision(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("triage_decisions")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as TriageDecisionRow;
  } catch {
    return demo.createTriageDecision(input);
  }
}

export async function getLatestTriageDecision(
  incidentId: string
): Promise<TriageDecisionRow | null> {
  if (shouldUseDemoStore()) {
    return demo.getLatestTriageDecision(incidentId) ?? null;
  }

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("triage_decisions")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as TriageDecisionRow) ?? null;
  } catch {
    return demo.getLatestTriageDecision(incidentId) ?? null;
  }
}

export async function saveDiyPlan(input: {
  incident_id: string;
  title: string;
  estimated_minutes?: number | null;
  tools: string[];
  safety_notes: string[];
  steps: Array<{
    order: number;
    instruction: string;
    success_check: string;
    failure_action: DiyStepRow["failure_action"];
  }>;
}): Promise<{ plan: DiyPlanRow; steps: DiyStepRow[] }> {
  if (shouldUseDemoStore()) return demo.createDiyPlan(input);

  try {
    const supabase = await getAdmin();
    const { data: plan, error } = await supabase
      .from("diy_plans")
      .insert({
        incident_id: input.incident_id,
        title: input.title,
        estimated_minutes: input.estimated_minutes ?? null,
        tools: input.tools,
        safety_notes: input.safety_notes,
      })
      .select()
      .single();
    if (error) throw error;

    const stepRows = input.steps.map((s) => ({
      plan_id: plan.id,
      step_order: s.order,
      instruction: s.instruction,
      success_check: s.success_check,
      failure_action: s.failure_action,
    }));
    const { data: steps, error: stepError } = await supabase
      .from("diy_steps")
      .insert(stepRows)
      .select();
    if (stepError) throw stepError;
    return { plan: plan as DiyPlanRow, steps: (steps as DiyStepRow[]) ?? [] };
  } catch {
    return demo.createDiyPlan(input);
  }
}

export async function getDiyPlanForIncident(incidentId: string) {
  if (shouldUseDemoStore()) return demo.getDiyPlanForIncident(incidentId);

  try {
    const supabase = await getAdmin();
    const { data: plan, error } = await supabase
      .from("diy_plans")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!plan) return null;
    const { data: steps, error: stepError } = await supabase
      .from("diy_steps")
      .select("*")
      .eq("plan_id", plan.id)
      .order("step_order", { ascending: true });
    if (stepError) throw stepError;
    return {
      plan: plan as DiyPlanRow,
      steps: (steps as DiyStepRow[]) ?? [],
    };
  } catch {
    return demo.getDiyPlanForIncident(incidentId);
  }
}

export async function createServiceRequest(
  input: Omit<ServiceRequestRow, "id" | "created_at" | "status"> & {
    status?: ServiceRequestRow["status"];
  }
): Promise<ServiceRequestRow> {
  if (shouldUseDemoStore()) return demo.createServiceRequest(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("service_requests")
      .insert({
        ...input,
        status: input.status ?? "OPEN",
      })
      .select()
      .single();
    if (error) throw error;
    return data as ServiceRequestRow;
  } catch {
    return demo.createServiceRequest(input);
  }
}

export async function getServiceRequest(
  id: string
): Promise<ServiceRequestRow | null> {
  if (shouldUseDemoStore()) return demo.getServiceRequest(id) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as ServiceRequestRow) ?? null;
  } catch {
    return demo.getServiceRequest(id) ?? null;
  }
}

export async function ensureServiceRequestForIncident(
  incidentId: string,
  opts?: { category?: string; area?: string; title?: string; summary?: string }
): Promise<ServiceRequestRow> {
  if (shouldUseDemoStore()) {
    return demo.ensureServiceRequestForIncident(incidentId, opts);
  }
  try {
    const supabase = await getAdmin();
    const { data: existing } = await supabase
      .from("service_requests")
      .select("*")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return existing as ServiceRequestRow;
  } catch {
    /* fall through to demo */
  }
  return demo.ensureServiceRequestForIncident(incidentId, opts);
}
