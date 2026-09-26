/**
 * Domain row types mirroring supabase/migrations/001_init.sql
 */
import type {
  BookingStatus,
  IncidentCategory,
  IncidentStatus,
  PaymentState,
  SafetyAssessment,
  TriageDecision,
} from "@/types";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};

export type Home = {
  id: string;
  user_id: string;
  name: string;
  city: string;
  area: string;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type HomeAsset = {
  id: string;
  home_id: string;
  asset_type: string;
  nickname: string;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Incident = {
  id: string;
  home_id: string;
  asset_id: string | null;
  status: IncidentStatus;
  initial_description: string;
  category_guess: IncidentCategory | string | null;
  created_at: string;
  resolved_at: string | null;
};

export type IncidentMessage = {
  id: string;
  incident_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SafetyAssessmentRow = {
  id: string;
  incident_id: string;
  level: SafetyAssessment["level"];
  hazard_codes: string[];
  stop_troubleshooting: boolean;
  safe_actions: string[];
  prohibited_actions: string[];
  created_at: string;
};

export type TriageDecisionRow = {
  id: string;
  incident_id: string;
  outcome: TriageDecision["outcome"];
  likely_issue: string;
  confidence: TriageDecision["confidence"];
  observed_facts: string[];
  concerns: string[];
  recommended_next_step: string;
  technician_trade: string | null;
  created_at: string;
};

export type DiyPlanRow = {
  id: string;
  incident_id: string;
  title: string;
  estimated_minutes: number | null;
  tools: string[];
  safety_notes: string[];
  created_at: string;
};

export type DiyStepRow = {
  id: string;
  plan_id: string;
  step_order: number;
  instruction: string;
  success_check: string;
  failure_action: "ASK_NEXT" | "ESCALATE" | "STOP";
};

export type ServiceRequestRow = {
  id: string;
  incident_id: string;
  category: string;
  area: string;
  title: string;
  problem_summary: string;
  symptoms: string[];
  urgency: "low" | "medium" | "high";
  hazard_notes: string[];
  actions_tried: string[];
  preferred_time: string | null;
  status: "OPEN" | "OFFERS_RECEIVED" | "BOOKED" | "CLOSED" | "CANCELLED";
  created_at: string;
};

export type Provider = {
  id: string;
  name: string;
  trade: string;
  rating: number;
  completed_jobs: number;
  verified: boolean;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type ProviderCoverage = {
  id: string;
  provider_id: string;
  area: string;
};

export type Offer = {
  id: string;
  service_request_id: string;
  provider_id: string;
  visit_fee: number | null;
  estimated_total_min: number | null;
  estimated_total_max: number | null;
  earliest_arrival: string | null;
  warranty_days: number | null;
  parts_included: "yes" | "no" | "unclear";
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";
  is_demo: boolean;
  created_at: string;
};

export type ChangeOrder = {
  reason: string;
  additional_amount: number;
  note?: string;
  status: "pending" | "approved" | "declined";
};

export type Booking = {
  id: string;
  service_request_id: string;
  offer_id: string;
  user_id: string;
  provider_id: string;
  status: BookingStatus;
  scheduled_for: string;
  created_at: string;
  updated_at: string;
  change_order?: ChangeOrder | null;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  state: PaymentState;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type RepairRecord = {
  id: string;
  home_id: string;
  asset_id: string | null;
  incident_id: string;
  booking_id: string | null;
  title: string;
  work_done: string;
  parts_replaced: string[];
  amount_paid: number | null;
  provider_name: string | null;
  completed_at: string;
  warranty_days: number | null;
  warranty_expires_at: string | null;
  before_images: string[];
  after_images: string[];
  notes: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
