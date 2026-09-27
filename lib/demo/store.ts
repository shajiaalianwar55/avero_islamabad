/**
 * In-memory demo data store mirroring supabase/seed.sql.
 * Used when NEXT_PUBLIC_DEMO_MODE=true or Supabase is not configured.
 */

import type {
  Booking,
  DiyPlanRow,
  DiyStepRow,
  Home,
  HomeAsset,
  Incident,
  IncidentMessage,
  Offer,
  Payment,
  Profile,
  Provider,
  ProviderCoverage,
  RepairRecord,
  Review,
  SafetyAssessmentRow,
  ServiceRequestRow,
  TriageDecisionRow,
} from "@/types/db";
import type { BookingStatus, IncidentStatus, PaymentState } from "@/types";

/** Fixed demo UUIDs — keep in sync with supabase/seed.sql */
export const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_HOME_ID = "22222222-2222-2222-2222-222222222222";
export const DEMO_AC_ASSET_ID = "33333333-3333-3333-3333-333333333333";
export const DEMO_SINK_ASSET_ID = "33333333-3333-3333-3333-333333333334";
export const DEMO_AC_INCIDENT_ID = "44444444-4444-4444-4444-444444444444";
export const DEMO_AC_REPAIR_ID = "55555555-5555-5555-5555-555555555555";

export const DEMO_PROVIDER_IDS = {
  plumber1: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
  plumber2: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
  plumber3: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
  plumber4: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
  electrician1: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
  electrician2: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
  electrician3: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3",
  electrician4: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4",
  ac1: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
  ac2: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
  ac3: "cccccccc-cccc-cccc-cccc-ccccccccccc3",
  ac4: "cccccccc-cccc-cccc-cccc-ccccccccccc4",
  pump1: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
  geyser1: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
  appliance1: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
  appliance2: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromIso(baseIso: string, days: number): string {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export type DemoStore = {
  profiles: Profile[];
  homes: Home[];
  homeAssets: HomeAsset[];
  incidents: Incident[];
  messages: IncidentMessage[];
  safetyAssessments: SafetyAssessmentRow[];
  triageDecisions: TriageDecisionRow[];
  diyPlans: DiyPlanRow[];
  diySteps: DiyStepRow[];
  serviceRequests: ServiceRequestRow[];
  providers: Provider[];
  providerCoverage: ProviderCoverage[];
  offers: Offer[];
  bookings: Booking[];
  payments: Payment[];
  repairRecords: RepairRecord[];
  reviews: Review[];
};

function seedProviders(): { providers: Provider[]; coverage: ProviderCoverage[] } {
  const created = nowIso();
  const providers: Provider[] = [
    { id: DEMO_PROVIDER_IDS.plumber1, name: "F-10 Pipe Pros", trade: "plumbing", rating: 4.8, completed_jobs: 214, verified: true, phone: "+92-300-1000001", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.plumber2, name: "Capital Leak Fix", trade: "plumbing", rating: 4.6, completed_jobs: 156, verified: true, phone: "+92-300-1000002", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.plumber3, name: "BlueLine Plumbing", trade: "plumbing", rating: 4.4, completed_jobs: 98, verified: true, phone: "+92-300-1000003", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.plumber4, name: "Sector Plumbers Co", trade: "plumbing", rating: 4.2, completed_jobs: 67, verified: false, phone: "+92-300-1000004", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.electrician1, name: "SafeSpark Electrical", trade: "electrical", rating: 4.9, completed_jobs: 301, verified: true, phone: "+92-300-2000001", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.electrician2, name: "VoltCare Islamabad", trade: "electrical", rating: 4.7, completed_jobs: 188, verified: true, phone: "+92-300-2000002", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.electrician3, name: "GridRight Electric", trade: "electrical", rating: 4.5, completed_jobs: 120, verified: true, phone: "+92-300-2000003", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.electrician4, name: "NightShift Sparks", trade: "electrical", rating: 4.3, completed_jobs: 74, verified: false, phone: "+92-300-2000004", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.ac1, name: "CoolBreeze AC Experts", trade: "ac", rating: 4.85, completed_jobs: 245, verified: true, phone: "+92-300-3000001", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.ac2, name: "FrostLine Cooling", trade: "ac", rating: 4.65, completed_jobs: 171, verified: true, phone: "+92-300-3000002", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.ac3, name: "Islamabad AC Care", trade: "ac", rating: 4.55, completed_jobs: 133, verified: true, phone: "+92-300-3000003", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.ac4, name: "QuickChill Services", trade: "ac", rating: 4.25, completed_jobs: 89, verified: false, phone: "+92-300-3000004", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.pump1, name: "PumpHouse Motors", trade: "water_pump", rating: 4.7, completed_jobs: 142, verified: true, phone: "+92-300-4000001", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.geyser1, name: "HotFlow Geyser Tech", trade: "geyser", rating: 4.6, completed_jobs: 110, verified: true, phone: "+92-300-4000002", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.appliance1, name: "ApplianceAid ISB", trade: "appliance", rating: 4.75, completed_jobs: 96, verified: true, phone: "+92-300-5000001", avatar_url: null, created_at: created },
    { id: DEMO_PROVIDER_IDS.appliance2, name: "HomeFix Appliances", trade: "appliance", rating: 4.4, completed_jobs: 58, verified: false, phone: "+92-300-5000002", avatar_url: null, created_at: created },
  ];

  const coveragePairs: Array<[string, string[]]> = [
    [DEMO_PROVIDER_IDS.plumber1, ["F-10", "F-11", "G-10"]],
    [DEMO_PROVIDER_IDS.plumber2, ["F-10", "F-8", "F-7"]],
    [DEMO_PROVIDER_IDS.plumber3, ["G-8", "G-9", "F-10"]],
    [DEMO_PROVIDER_IDS.plumber4, ["I-8", "I-9", "I-10"]],
    [DEMO_PROVIDER_IDS.electrician1, ["F-10", "F-11", "E-11"]],
    [DEMO_PROVIDER_IDS.electrician2, ["F-6", "F-7", "F-10"]],
    [DEMO_PROVIDER_IDS.electrician3, ["G-10", "G-11", "G-13"]],
    [DEMO_PROVIDER_IDS.electrician4, ["Bahria Town", "DHA", "PWD"]],
    [DEMO_PROVIDER_IDS.ac1, ["F-10", "F-11", "G-10"]],
    [DEMO_PROVIDER_IDS.ac2, ["F-8", "F-10", "H-8"]],
    [DEMO_PROVIDER_IDS.ac3, ["G-8", "G-9", "G-11"]],
    [DEMO_PROVIDER_IDS.ac4, ["Bani Gala", "Gulberg Greens", "Other"]],
    [DEMO_PROVIDER_IDS.pump1, ["F-10", "G-10", "G-11", "I-8"]],
    [DEMO_PROVIDER_IDS.geyser1, ["F-10", "F-11", "E-11", "G-15"]],
    [DEMO_PROVIDER_IDS.appliance1, ["F-10", "F-7", "F-8"]],
    [DEMO_PROVIDER_IDS.appliance2, ["G-9", "G-10", "I-10"]],
  ];

  const coverage: ProviderCoverage[] = coveragePairs.flatMap(([provider_id, areas]) =>
    areas.map((area) => ({
      id: newId(),
      provider_id,
      area,
    }))
  );

  return { providers, coverage };
}

function createSeedStore(): DemoStore {
  const created = nowIso();
  const acCompleted = daysAgoIso(44);
  const { providers, coverage } = seedProviders();

  return {
    profiles: [
      {
        id: DEMO_USER_ID,
        full_name: "Demo Resident",
        phone: "+92-300-0000000",
        created_at: created,
      },
    ],
    homes: [
      {
        id: DEMO_HOME_ID,
        user_id: DEMO_USER_ID,
        name: "F-10 Family Home",
        city: "Islamabad",
        area: "F-10",
        address_text: "Street 12, F-10/2, Islamabad",
        latitude: 33.6938,
        longitude: 73.0135,
        created_at: created,
      },
    ],
    homeAssets: [
      {
        id: DEMO_AC_ASSET_ID,
        home_id: DEMO_HOME_ID,
        asset_type: "ac",
        nickname: "Bedroom AC",
        brand: "Gree",
        model: "Split 1.5 Ton",
        install_date: "2023-04-15",
        notes: "Primary bedroom wall unit",
        created_at: created,
      },
      {
        id: DEMO_SINK_ASSET_ID,
        home_id: DEMO_HOME_ID,
        asset_type: "plumbing",
        nickname: "Kitchen Sink",
        brand: null,
        model: null,
        install_date: null,
        notes: "Under-sink P-trap area",
        created_at: created,
      },
    ],
    incidents: [
      {
        id: DEMO_AC_INCIDENT_ID,
        home_id: DEMO_HOME_ID,
        asset_id: DEMO_AC_ASSET_ID,
        status: "RESOLVED",
        initial_description: "Bedroom AC not cooling properly, weak airflow",
        category_guess: "ac",
        created_at: daysAgoIso(45),
        resolved_at: acCompleted,
      },
    ],
    messages: [],
    safetyAssessments: [],
    triageDecisions: [],
    diyPlans: [],
    diySteps: [],
    serviceRequests: [],
    providers,
    providerCoverage: coverage,
    offers: [],
    bookings: [],
    payments: [],
    repairRecords: [
      {
        id: DEMO_AC_REPAIR_ID,
        home_id: DEMO_HOME_ID,
        asset_id: DEMO_AC_ASSET_ID,
        incident_id: DEMO_AC_INCIDENT_ID,
        booking_id: null,
        title: "Bedroom AC service",
        work_done:
          "Cleaned evaporator coil, replaced air filter, recharged refrigerant top-up",
        parts_replaced: ["air filter", "R410A top-up"],
        amount_paid: 6500,
        provider_name: "CoolBreeze AC Experts",
        completed_at: acCompleted,
        warranty_days: 90,
        warranty_expires_at: daysFromIso(acCompleted, 90),
        before_images: [],
        after_images: [],
        notes: "Active warranty — coil and filter work covered",
        created_at: acCompleted,
      },
    ],
    reviews: [],
  };
}

const globalForDemo = globalThis as unknown as { __averoDemoStore?: DemoStore };

if (!globalForDemo.__averoDemoStore) {
  globalForDemo.__averoDemoStore = createSeedStore();
}

/** Module binding kept in sync with globalThis so HMR does not wipe demo offers/bookings. */
let store: DemoStore = globalForDemo.__averoDemoStore;

export function getDemoStore(): DemoStore {
  return store;
}

export function resetDemoStore(): DemoStore {
  store = createSeedStore();
  globalForDemo.__averoDemoStore = store;
  return store;
}

export function createIncident(input: {
  home_id?: string;
  asset_id?: string | null;
  initial_description: string;
  category_guess?: string | null;
  status?: IncidentStatus;
}): Incident {
  const incident: Incident = {
    id: newId(),
    home_id: input.home_id ?? DEMO_HOME_ID,
    asset_id: input.asset_id ?? null,
    status: input.status ?? "TRIAGE",
    initial_description: input.initial_description,
    category_guess: input.category_guess ?? null,
    created_at: nowIso(),
    resolved_at: null,
  };
  store.incidents.push(incident);
  return incident;
}

export function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  resolvedAt?: string | null
): Incident | null {
  const incident = store.incidents.find((i) => i.id === incidentId);
  if (!incident) return null;
  incident.status = status;
  if (resolvedAt !== undefined) incident.resolved_at = resolvedAt;
  if (status === "RESOLVED" || status === "CLOSED") {
    incident.resolved_at = resolvedAt ?? nowIso();
  }
  return incident;
}

export function getIncident(incidentId: string): Incident | undefined {
  return store.incidents.find((i) => i.id === incidentId);
}

export function createMessage(input: {
  incident_id: string;
  role: IncidentMessage["role"];
  content: string;
  metadata?: Record<string, unknown>;
}): IncidentMessage {
  const message: IncidentMessage = {
    id: newId(),
    incident_id: input.incident_id,
    role: input.role,
    content: input.content,
    metadata: input.metadata ?? {},
    created_at: nowIso(),
  };
  store.messages.push(message);
  return message;
}

export function listMessages(incidentId: string): IncidentMessage[] {
  return store.messages
    .filter((m) => m.incident_id === incidentId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function createSafetyAssessment(
  input: Omit<SafetyAssessmentRow, "id" | "created_at">
): SafetyAssessmentRow {
  const row: SafetyAssessmentRow = {
    ...input,
    id: newId(),
    created_at: nowIso(),
  };
  store.safetyAssessments.push(row);
  return row;
}

export function createTriageDecision(
  input: Omit<TriageDecisionRow, "id" | "created_at">
): TriageDecisionRow {
  const row: TriageDecisionRow = {
    ...input,
    id: newId(),
    created_at: nowIso(),
  };
  store.triageDecisions.push(row);
  return row;
}

export function getLatestTriageDecision(
  incidentId: string
): TriageDecisionRow | undefined {
  return store.triageDecisions
    .filter((d) => d.incident_id === incidentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function createDiyPlan(input: {
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
}): { plan: DiyPlanRow; steps: DiyStepRow[] } {
  const plan: DiyPlanRow = {
    id: newId(),
    incident_id: input.incident_id,
    title: input.title,
    estimated_minutes: input.estimated_minutes ?? null,
    tools: input.tools,
    safety_notes: input.safety_notes,
    created_at: nowIso(),
  };
  store.diyPlans.push(plan);
  const steps = input.steps.map((s) => {
    const step: DiyStepRow = {
      id: newId(),
      plan_id: plan.id,
      step_order: s.order,
      instruction: s.instruction,
      success_check: s.success_check,
      failure_action: s.failure_action,
    };
    store.diySteps.push(step);
    return step;
  });
  return { plan, steps };
}

export function getDiyPlanForIncident(incidentId: string): {
  plan: DiyPlanRow;
  steps: DiyStepRow[];
} | null {
  const plan = store.diyPlans
    .filter((p) => p.incident_id === incidentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!plan) return null;
  const steps = store.diySteps
    .filter((s) => s.plan_id === plan.id)
    .sort((a, b) => a.step_order - b.step_order);
  return { plan, steps };
}

export function createServiceRequest(
  input: Omit<ServiceRequestRow, "id" | "created_at" | "status"> & {
    status?: ServiceRequestRow["status"];
  }
): ServiceRequestRow {
  const row: ServiceRequestRow = {
    ...input,
    id: newId(),
    status: input.status ?? "OPEN",
    created_at: nowIso(),
  };
  store.serviceRequests.push(row);
  return row;
}

export function getServiceRequest(id: string): ServiceRequestRow | undefined {
  return store.serviceRequests.find((r) => r.id === id);
}

export function listOpenServiceRequests(): ServiceRequestRow[] {
  return store.serviceRequests
    .filter((r) => r.status === "OPEN" || r.status === "OFFERS_RECEIVED")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listProviders(opts?: {
  trade?: string;
  area?: string;
}): Array<Provider & { coverage_areas: string[] }> {
  let list = [...store.providers];
  if (opts?.trade) {
    const trade = opts.trade;
    list = list.filter(
      (p) =>
        p.trade === trade ||
        (trade === "geyser" && p.trade === "water_pump") ||
        (trade === "water_pump" && p.trade === "geyser")
    );
  }
  return list
    .map((p) => {
      const coverage_areas = store.providerCoverage
        .filter((c) => c.provider_id === p.id)
        .map((c) => c.area);
      return { ...p, coverage_areas };
    })
    .filter((p) => (opts?.area ? p.coverage_areas.includes(opts.area) : true));
}

export function getProvider(id: string): Provider | undefined {
  return store.providers.find((p) => p.id === id);
}

export function createOffer(
  input: Omit<Offer, "id" | "created_at" | "status" | "is_demo"> & {
    status?: Offer["status"];
    is_demo?: boolean;
  }
): Offer {
  const offer: Offer = {
    ...input,
    id: newId(),
    status: input.status ?? "PENDING",
    is_demo: input.is_demo ?? false,
    created_at: nowIso(),
  };
  store.offers.push(offer);
  const sr = store.serviceRequests.find((r) => r.id === offer.service_request_id);
  if (sr && sr.status === "OPEN") sr.status = "OFFERS_RECEIVED";
  return offer;
}

export function listOffers(serviceRequestId: string): Offer[] {
  return store.offers
    .filter((o) => o.service_request_id === serviceRequestId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function getOffer(id: string): Offer | undefined {
  return store.offers.find((o) => o.id === id);
}

export function loadDemoOffers(serviceRequestId: string): Offer[] {
  const sr = getServiceRequest(serviceRequestId);
  if (!sr) return [];

  const trade =
    sr.category === "plumbing"
      ? "plumbing"
      : sr.category === "electrical"
        ? "electrical"
        : sr.category === "ac"
          ? "ac"
          : sr.category;

  const candidates = listProviders({ trade, area: sr.area }).slice(0, 3);
  const existing = new Set(
    listOffers(serviceRequestId).map((o) => o.provider_id)
  );

  const created: Offer[] = [];
  const templates = [
    {
      visit_fee: 800,
      estimated_total_min: 2500,
      estimated_total_max: 4500,
      warranty_days: 30,
      parts_included: "no" as const,
      hours: 2,
      notes: "Demo offer — standard visit + diagnosis",
    },
    {
      visit_fee: 500,
      estimated_total_min: 2000,
      estimated_total_max: 3500,
      warranty_days: 14,
      parts_included: "unclear" as const,
      hours: 1,
      notes: "Demo offer — earliest arrival, lower warranty",
    },
    {
      visit_fee: 1000,
      estimated_total_min: 3000,
      estimated_total_max: 5500,
      warranty_days: 60,
      parts_included: "yes" as const,
      hours: 4,
      notes: "Demo offer — longer warranty, parts included where listed",
    },
  ];

  let i = 0;
  for (const provider of candidates) {
    if (existing.has(provider.id)) continue;
    const t = templates[i % templates.length]!;
    const arrival = new Date();
    arrival.setHours(arrival.getHours() + t.hours);
    created.push(
      createOffer({
        service_request_id: serviceRequestId,
        provider_id: provider.id,
        visit_fee: t.visit_fee,
        estimated_total_min: t.estimated_total_min,
        estimated_total_max: t.estimated_total_max,
        earliest_arrival: arrival.toISOString(),
        warranty_days: t.warranty_days,
        parts_included: t.parts_included,
        notes: t.notes,
        is_demo: true,
      })
    );
    i += 1;
    if (created.length >= 2) break;
  }

  // Ensure at least 2 demo offers even if coverage is sparse
  while (created.length < 2) {
    const fallback =
      store.providers.find((p) => p.trade === trade) ?? store.providers[0]!;
    if (existing.has(fallback.id) && created.some((c) => c.provider_id === fallback.id)) {
      break;
    }
    const t = templates[created.length % templates.length]!;
    const arrival = new Date();
    arrival.setHours(arrival.getHours() + t.hours + created.length);
    created.push(
      createOffer({
        service_request_id: serviceRequestId,
        provider_id: fallback.id,
        visit_fee: t.visit_fee,
        estimated_total_min: t.estimated_total_min,
        estimated_total_max: t.estimated_total_max,
        earliest_arrival: arrival.toISOString(),
        warranty_days: t.warranty_days,
        parts_included: t.parts_included,
        notes: t.notes,
        is_demo: true,
      })
    );
  }

  return listOffers(serviceRequestId);
}

export function createBooking(input: {
  service_request_id: string;
  offer_id: string;
  user_id?: string;
  provider_id: string;
  scheduled_for: string;
  amount: number;
}): { booking: Booking; payment: Payment } {
  const booking: Booking = {
    id: newId(),
    service_request_id: input.service_request_id,
    offer_id: input.offer_id,
    user_id: input.user_id ?? DEMO_USER_ID,
    provider_id: input.provider_id,
    status: "CONFIRMED",
    scheduled_for: input.scheduled_for,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store.bookings.push(booking);

  const offer = getOffer(input.offer_id);
  if (offer) offer.status = "ACCEPTED";

  const sr = getServiceRequest(input.service_request_id);
  if (sr) sr.status = "BOOKED";

  const incidentId = sr?.incident_id;
  if (incidentId) updateIncidentStatus(incidentId, "BOOKED");

  const payment: Payment = {
    id: newId(),
    booking_id: booking.id,
    amount: input.amount,
    currency: "PKR",
    state: "PROTECTED",
    is_demo: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store.payments.push(payment);

  return { booking, payment };
}

export function getBooking(id: string): Booking | undefined {
  return store.bookings.find((b) => b.id === id);
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Booking | null {
  const booking = getBooking(bookingId);
  if (!booking) return null;
  booking.status = status;
  booking.updated_at = nowIso();
  return booking;
}

export function getPaymentForBooking(bookingId: string): Payment | undefined {
  return store.payments.find((p) => p.booking_id === bookingId);
}

export function updatePaymentState(
  bookingId: string,
  state: PaymentState
): Payment | null {
  const payment = getPaymentForBooking(bookingId);
  if (!payment) return null;
  payment.state = state;
  payment.updated_at = nowIso();
  return payment;
}

export function createRepairRecord(
  input: Omit<RepairRecord, "id" | "created_at">
): RepairRecord {
  const row: RepairRecord = {
    ...input,
    id: newId(),
    created_at: nowIso(),
  };
  store.repairRecords.push(row);
  return row;
}

export function listRepairHistory(homeId: string = DEMO_HOME_ID): RepairRecord[] {
  return store.repairRecords
    .filter((r) => r.home_id === homeId)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}

export function getHome(homeId: string = DEMO_HOME_ID): Home | undefined {
  return store.homes.find((h) => h.id === homeId);
}

export function getHomeAssets(homeId: string = DEMO_HOME_ID): HomeAsset[] {
  return store.homeAssets.filter((a) => a.home_id === homeId);
}

export function createReview(input: {
  booking_id: string;
  rating: number;
  comment?: string | null;
}): Review {
  const row: Review = {
    id: newId(),
    booking_id: input.booking_id,
    rating: input.rating,
    comment: input.comment ?? null,
    created_at: nowIso(),
  };
  store.reviews.push(row);
  return row;
}

// ---------------------------------------------------------------------------
// Compatibility aliases for existing UI / pipeline callers
// ---------------------------------------------------------------------------

/** @deprecated Prefer getDemoStore() */
export function getStore(): DemoStore & {
  repairs: RepairRecord[];
  safety: SafetyAssessmentRow[];
  decisions: TriageDecisionRow[];
} {
  return {
    ...store,
    get repairs() {
      return store.repairRecords;
    },
    get safety() {
      return store.safetyAssessments;
    },
    get decisions() {
      return store.triageDecisions;
    },
  };
}

export function getPaymentByBooking(bookingId: string): Payment | undefined {
  return getPaymentForBooking(bookingId);
}

export function getRepair(id: string): RepairRecord | undefined {
  return store.repairRecords.find((r) => r.id === id);
}

export function listRepairs(homeId: string = DEMO_HOME_ID): RepairRecord[] {
  return listRepairHistory(homeId);
}

export function updateIncident(
  incidentId: string,
  patch: Partial<Pick<Incident, "status" | "category_guess" | "resolved_at" | "asset_id">>
): Incident | null {
  const incident = getIncident(incidentId);
  if (!incident) return null;
  if (patch.status) incident.status = patch.status;
  if (patch.category_guess !== undefined) incident.category_guess = patch.category_guess;
  if (patch.resolved_at !== undefined) incident.resolved_at = patch.resolved_at;
  if (patch.asset_id !== undefined) incident.asset_id = patch.asset_id;
  return incident;
}

/** Convenience overload used by triage pipeline UI helpers */
export function addMessage(
  incidentId: string,
  role: IncidentMessage["role"],
  content: string,
  metadata?: Record<string, unknown>
): IncidentMessage;
export function addMessage(input: {
  incident_id: string;
  role: IncidentMessage["role"];
  content: string;
  metadata?: Record<string, unknown>;
}): IncidentMessage;
export function addMessage(
  incidentIdOrInput:
    | string
    | {
        incident_id: string;
        role: IncidentMessage["role"];
        content: string;
        metadata?: Record<string, unknown>;
      },
  role?: IncidentMessage["role"],
  content?: string,
  metadata?: Record<string, unknown>
): IncidentMessage {
  if (typeof incidentIdOrInput === "string") {
    return createMessage({
      incident_id: incidentIdOrInput,
      role: role!,
      content: content!,
      metadata,
    });
  }
  return createMessage(incidentIdOrInput);
}

export function updateBooking(
  bookingId: string,
  patch: Partial<Pick<Booking, "status" | "scheduled_for" | "change_order">>
): Booking | null {
  const booking = getBooking(bookingId);
  if (!booking) return null;
  if (patch.status) booking.status = patch.status;
  if (patch.scheduled_for) booking.scheduled_for = patch.scheduled_for;
  if (patch.change_order !== undefined) booking.change_order = patch.change_order;
  booking.updated_at = nowIso();
  return booking;
}
