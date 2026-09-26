export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export type IncidentCategory =
  | "plumbing"
  | "electrical"
  | "ac"
  | "water_pump"
  | "geyser"
  | "ups_inverter"
  | "solar"
  | "appliance"
  | "structural"
  | "unknown";

export type IncidentStatus =
  | "TRIAGE"
  | "DIY_ACTIVE"
  | "TECHNICIAN_REQUIRED"
  | "EMERGENCY"
  | "SERVICE_REQUESTED"
  | "BOOKED"
  | "RESOLVED"
  | "CLOSED";

export type BookingStatus =
  | "CONFIRMED"
  | "TECHNICIAN_EN_ROUTE"
  | "IN_PROGRESS"
  | "AWAITING_CUSTOMER_CONFIRMATION"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export type PaymentState =
  | "PENDING"
  | "AUTHORIZED"
  | "PROTECTED"
  | "RELEASE_PENDING"
  | "RELEASED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "DISPUTED";

export type IncidentIntake = {
  category_guess: IncidentCategory;
  symptoms: string[];
  location_in_home?: string;
  detected_hazards: string[];
  missing_information: string[];
};

export type NextQuestion = {
  should_ask: boolean;
  question?: string;
  reason_code?:
    | "identify_source"
    | "assess_severity"
    | "check_safety"
    | "differentiate_causes"
    | "check_user_action"
    | "enough_information";
  expected_answer_type?: "yes_no" | "choice" | "short_text";
  choices?: string[];
};

export type SafetyAssessment = {
  level: "normal" | "caution" | "emergency";
  hazard_codes: string[];
  stop_troubleshooting: boolean;
  safe_immediate_actions: string[];
  prohibited_actions: string[];
};

export type TriageDecision = {
  outcome: "DIY" | "TECHNICIAN" | "EMERGENCY";
  likely_issue: string;
  confidence: "low" | "medium" | "high";
  observed_facts: string[];
  concerns: string[];
  recommended_next_step: string;
  technician_trade?: string;
};

export type DiyStep = {
  order: number;
  instruction: string;
  success_check: string;
  failure_action: "ASK_NEXT" | "ESCALATE" | "STOP";
};

export type DiyPlan = {
  title: string;
  estimated_minutes?: number;
  tools: string[];
  safety_notes: string[];
  steps: DiyStep[];
};

export type DiyReassessment = {
  status: "CONTINUE" | "RESOLVED" | "ESCALATE_TECHNICIAN" | "EMERGENCY";
  next_step_number?: number;
  reason_summary: string;
};

export type ServiceRequestContract = {
  incident_id: string;
  city: "Islamabad";
  area: string;
  category: string;
  title: string;
  problem_summary: string;
  symptoms: string[];
  likely_issue?: string;
  urgency: "low" | "medium" | "high";
  hazard_notes: string[];
  actions_already_tried: string[];
  preferred_time?: string;
  image_urls: string[];
  created_at: string;
};

export type NormalizedOffer = {
  provider_id: string;
  service_request_id: string;
  visit_fee?: number;
  estimated_total_min?: number;
  estimated_total_max?: number;
  earliest_arrival?: string;
  warranty_days?: number;
  parts_included: "yes" | "no" | "unclear";
  notes: string[];
  unknown_fields: string[];
};

export const ISLAMABAD_AREAS = [
  "F-6",
  "F-7",
  "F-8",
  "F-10",
  "F-11",
  "G-8",
  "G-9",
  "G-10",
  "G-11",
  "G-13",
  "G-15",
  "I-8",
  "I-9",
  "I-10",
  "E-11",
  "H-8",
  "Bani Gala",
  "Bahria Town",
  "DHA",
  "PWD",
  "Gulberg Greens",
  "Other",
] as const;

export type IslamabadArea = (typeof ISLAMABAD_AREAS)[number];

export const SERVICE_CATEGORIES = [
  { id: "ac", label: "AC" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "water_pump", label: "Water motor" },
  { id: "geyser", label: "Geyser" },
  { id: "ups_inverter", label: "UPS / inverter" },
  { id: "solar", label: "Solar" },
  { id: "appliance", label: "Appliance" },
] as const;
