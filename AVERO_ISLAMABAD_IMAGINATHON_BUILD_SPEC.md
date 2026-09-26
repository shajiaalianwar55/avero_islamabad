# Avero Islamabad
## Banao Imaginathon Build Specification

## 1. Core strategy

### One-line product
**Avero is Islamabad's AI home incident first responder. It helps residents understand what is wrong, decide whether it is safe to DIY, needs a technician, or is an emergency, and then coordinates the next step.**

### The single city problem
When something breaks at home, residents often know the symptom but not the cause, the urgency, or the right professional to call. The first response is guesswork.

Avero should NOT be pitched as another technician marketplace.

Islamabad already has home-service providers and booking platforms. The differentiator is that Avero solves the decision problem before booking:

1. Understand the incident.
2. Ask adaptive follow-up questions.
3. Check for danger.
4. Decide DIY vs Technician vs Emergency.
5. Guide safe DIY when appropriate.
6. Convert professional cases into structured service requests.
7. Match providers by Islamabad area and trade.
8. Compare offers transparently.
9. Track booking and protected payment state.
10. Save the repair and warranty in Home History.

### Tagline
**When something breaks, know what to do next.**

---

# 2. How the build maps to the judging criteria

## City understanding, 20 points
The app must visibly feel built for Islamabad.

Build:
- Islamabad sector/society selection.
- Provider coverage by area.
- Local repair categories: plumbing, electrical, AC, water motor/pump, geyser, UPS/inverter, solar/inverter, appliances.
- Islamabad examples such as F-10, G-11, I-8, E-11, Bahria, DHA, Bani Gala and PWD.
- A concise "Why Islamabad?" section.
- City-specific demo data and service areas.
- No false claim that Islamabad lacks home-service platforms.

## Idea and impact, 25 points
Demonstrate improvement in the first minutes after a home incident:
- danger is identified sooner
- simple issues can be resolved safely without a visit
- technicians receive clearer job scopes
- residents compare offers instead of repeating the problem several times
- price changes are explicit
- completed repairs become useful history

Future impact metrics to track:
- time to classification
- percentage safely resolved via DIY
- percentage safety-escalated
- average offers compared
- booking completion
- repeat issue detection
- warranty recovery

Do not present future metrics as real results.

## Original thinking, 20 points
Avero's originality is the full first-response loop:
- adaptive AI triage
- safety gate
- DIY guidance one step at a time
- dynamic escalation if new evidence appears
- structured handoff to technician
- transparent offer comparison
- protected payment workflow
- Home History with warranty awareness

## Execution, 25 points
The submission must be a deployed working app.

Required live path:
**Report problem -> AI questions -> classification -> DIY or technician path -> offers -> booking -> payment state -> repair completion -> Home History**

Use a real database and persistent records.

## Clarity, 10 points
The first 15 seconds should be:

> "When something breaks at home in Islamabad, the first problem is not booking a technician. It is knowing what is wrong, how urgent it is, and what to do next. Avero is an AI home incident first responder that triages the problem, guides safe DIY, and coordinates professional help when needed."

---

# 3. Product scope

## P0, required
1. Islamabad onboarding/location
2. New incident intake
3. Adaptive AI questioning
4. Safety gate
5. DIY / Technician / Emergency classification
6. User-facing decision evidence
7. Interactive DIY mode
8. Dynamic escalation
9. Structured service request
10. Local provider matching
11. Provider dashboard
12. Offer submission
13. Offer comparison
14. Booking
15. Protected payment state machine
16. Repair completion
17. Home History
18. Warranty awareness
19. Judge demo mode
20. Reliable cloud deployment

## P1, strong additions
1. Image-assisted diagnosis
2. Voice input
3. English / Roman Urdu text toggle
4. Home asset profiles
5. Before / after photos
6. Reviews
7. Dispute workflow
8. Provider verification fields
9. History-aware AI context
10. Location distance / ETA

## P2, only after polish
1. Real payment gateway
2. WhatsApp Business integration
3. Google Places live discovery
4. Live maps
5. Push notifications
6. Production KYC
7. Emergency service integrations
8. Native mobile app

---

# 4. Recommended stack

## Frontend
- Next.js
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

## Backend
Use Next.js server routes/server actions for the hackathon.

## Database and auth
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage

Provide **Continue as Demo Resident** so judges do not need sign-up.

## AI
Use one fast multimodal model behind an abstraction.

Create:
`lib/ai/provider.ts`

Environment:
```env
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
```

Never hard-wire the app to one model vendor.

## Deployment
- Vercel
- Supabase

The core demo must not depend on Twilio, WhatsApp approval, real payments, Google Maps billing, or live provider APIs.

---

# 5. Routes and screens

## Public
### `/`
Landing page:
1. Hero
2. "Something broke. What now?"
3. DIY / Technician / Emergency
4. How Avero works
5. Why Islamabad
6. Home History
7. Payment protection
8. CTA

### `/about-islamabad`
Short city problem page:
- sector-based service model
- local repair categories
- first-response gap
- local focus

## Resident
### `/app`
Dashboard:
- Report a problem
- Active incident
- Upcoming technician
- Payment status
- Home History
- Warranty alerts

### `/incident/new`
Inputs:
- typed description
- optional voice
- optional photo
- home/location

### `/incident/[id]`
Adaptive triage conversation.

### `/incident/[id]/decision`
Show:
- DIY / Technician / Emergency
- observed facts
- concern
- recommendation
- confidence band

### `/incident/[id]/diy`
One-step-at-a-time DIY mode.

### `/incident/[id]/providers`
Provider offers.

### `/booking/[id]`
Booking and payment protection state.

### `/home`
Home profile and assets.

### `/history`
Repair timeline.

### `/history/[repairId]`
Full repair record.

## Provider
### `/provider`
Dashboard.

### `/provider/requests/[id]`
Structured request.

### `/provider/offers/[id]`
Submit quote.

### `/provider/jobs/[id]`
Update and complete job.

---

# 6. Core user journeys

## Technician case
1. Resident selects F-10.
2. Reports: "There is water under my kitchen sink."
3. Avero asks relevant questions.
4. Safety is checked after every message.
5. Avero decides Technician.
6. It shows decision evidence.
7. It creates a structured plumbing request.
8. Matching providers see it.
9. Providers submit offers.
10. User compares price, arrival, rating and warranty.
11. User books.
12. Payment enters protected demo state.
13. Technician completes job.
14. User confirms.
15. Repair is saved to Home History with warranty.

## DIY case
1. User reports low-risk issue.
2. Avero asks questions.
3. Avero selects DIY.
4. It gives only one step at a time.
5. User can choose Done, Cannot do this, Something looks different, or Stop.
6. Avero reassesses.
7. It can resolve or escalate.

## Emergency case
Example: buzzing socket plus burning smell.
1. Safety gate detects hazard.
2. Normal troubleshooting stops.
3. Emergency UI appears.
4. Avero gives short conservative safety actions.
5. No risky repair instructions are given.
6. Professional/emergency escalation is shown.

---

# 7. AI system

Do not use one giant prompt.

## 7.1 Incident parser
Input: original description.

Output:
```ts
type IncidentIntake = {
  category_guess:
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
  symptoms: string[];
  location_in_home?: string;
  detected_hazards: string[];
  missing_information: string[];
};
```

## 7.2 Adaptive question planner
```ts
type NextQuestion = {
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
```

Rules:
- one question at a time
- no repetition
- safety first
- stop when enough information exists
- no irrelevant curiosity questions

## 7.3 Safety gate
Use both deterministic rules and AI classification.

High-risk triggers:
- gas smell
- visible flame
- smoke
- sparks
- burning electrical smell
- exposed live wiring
- electricity plus standing water
- severe flooding near electrical systems
- suspected carbon monoxide
- structural collapse signs
- rapidly overheating electrical device

Output:
```ts
type SafetyAssessment = {
  level: "normal" | "caution" | "emergency";
  hazard_codes: string[];
  stop_troubleshooting: boolean;
  safe_immediate_actions: string[];
  prohibited_actions: string[];
};
```

If `stop_troubleshooting` is true, normal DIY is blocked.

## 7.4 Outcome classifier
```ts
type TriageDecision = {
  outcome: "DIY" | "TECHNICIAN" | "EMERGENCY";
  likely_issue: string;
  confidence: "low" | "medium" | "high";
  observed_facts: string[];
  concerns: string[];
  recommended_next_step: string;
  technician_trade?: string;
};
```

Do not show hidden chain-of-thought. Only show facts, concerns, decision and next step.

## 7.5 DIY planner
```ts
type DiyPlan = {
  title: string;
  estimated_minutes?: number;
  tools: string[];
  safety_notes: string[];
  steps: DiyStep[];
};

type DiyStep = {
  order: number;
  instruction: string;
  success_check: string;
  failure_action: "ASK_NEXT" | "ESCALATE" | "STOP";
};
```

The UI shows one step only.

## 7.6 DIY reassessment
```ts
type DiyReassessment = {
  status: "CONTINUE" | "RESOLVED" | "ESCALATE_TECHNICIAN" | "EMERGENCY";
  next_step_number?: number;
  reason_summary: string;
};
```

## 7.7 Service request contract
```ts
type ServiceRequestContract = {
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
```

## 7.8 Offer normalizer
```ts
type NormalizedOffer = {
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
```

Missing fields must stay unknown. Never invent.

## 7.9 Offer scoring
Use deterministic scoring, then AI can explain it.

Example:
```ts
score =
  skillMatch * 0.25 +
  ratingScore * 0.20 +
  availabilityScore * 0.20 +
  priceScore * 0.15 +
  warrantyScore * 0.10 +
  distanceScore * 0.10;
```

Show:
- Recommended
- Cheapest
- Earliest
- Longest warranty

The user can choose any offer.

## 7.10 History context
Before triage, check relevant asset/repair history.

Example:
"My bedroom AC stopped cooling again."

Avero should notice if the same AC was repaired recently and whether warranty remains.

---

# 8. Database schema

Create Supabase migrations.

## `profiles`
```text
id UUID PK
full_name TEXT
phone TEXT NULL
created_at TIMESTAMPTZ
```

## `homes`
```text
id UUID PK
user_id UUID FK
name TEXT
city TEXT DEFAULT 'Islamabad'
area TEXT
address_text TEXT NULL
latitude NUMERIC NULL
longitude NUMERIC NULL
created_at TIMESTAMPTZ
```

## `home_assets`
```text
id UUID PK
home_id UUID FK
asset_type TEXT
nickname TEXT
brand TEXT NULL
model TEXT NULL
install_date DATE NULL
notes TEXT NULL
created_at TIMESTAMPTZ
```

## `incidents`
```text
id UUID PK
home_id UUID FK
asset_id UUID NULL FK
status TEXT
initial_description TEXT
category_guess TEXT
created_at TIMESTAMPTZ
resolved_at TIMESTAMPTZ NULL
```

Status:
```text
TRIAGE
DIY_ACTIVE
TECHNICIAN_REQUIRED
EMERGENCY
SERVICE_REQUESTED
BOOKED
RESOLVED
CLOSED
```

## `incident_messages`
```text
id UUID PK
incident_id UUID FK
role TEXT
content TEXT
metadata JSONB
created_at TIMESTAMPTZ
```

## `safety_assessments`
```text
id UUID PK
incident_id UUID FK
level TEXT
hazard_codes JSONB
stop_troubleshooting BOOLEAN
safe_actions JSONB
created_at TIMESTAMPTZ
```

## `triage_decisions`
```text
id UUID PK
incident_id UUID FK
outcome TEXT
likely_issue TEXT
confidence TEXT
observed_facts JSONB
concerns JSONB
recommended_next_step TEXT
technician_trade TEXT NULL
created_at TIMESTAMPTZ
```

## `diy_plans`
```text
id UUID PK
incident_id UUID FK
title TEXT
tools JSONB
safety_notes JSONB
created_at TIMESTAMPTZ
```

## `diy_steps`
```text
id UUID PK
plan_id UUID FK
step_order INT
instruction TEXT
success_check TEXT
failure_action TEXT
```

## `service_requests`
```text
id UUID PK
incident_id UUID FK
category TEXT
area TEXT
title TEXT
problem_summary TEXT
symptoms JSONB
urgency TEXT
hazard_notes JSONB
actions_tried JSONB
preferred_time TEXT NULL
status TEXT
created_at TIMESTAMPTZ
```

## `providers`
```text
id UUID PK
name TEXT
trade TEXT
rating NUMERIC
completed_jobs INT
verified BOOLEAN
phone TEXT NULL
avatar_url TEXT NULL
created_at TIMESTAMPTZ
```

## `provider_coverage`
```text
id UUID PK
provider_id UUID FK
area TEXT
```

## `offers`
```text
id UUID PK
service_request_id UUID FK
provider_id UUID FK
visit_fee NUMERIC NULL
estimated_total_min NUMERIC NULL
estimated_total_max NUMERIC NULL
earliest_arrival TIMESTAMPTZ NULL
warranty_days INT NULL
parts_included TEXT
notes TEXT
status TEXT
created_at TIMESTAMPTZ
```

## `bookings`
```text
id UUID PK
service_request_id UUID FK
offer_id UUID FK
user_id UUID FK
provider_id UUID FK
status TEXT
scheduled_for TIMESTAMPTZ
created_at TIMESTAMPTZ
```

States:
```text
CONFIRMED
TECHNICIAN_EN_ROUTE
IN_PROGRESS
AWAITING_CUSTOMER_CONFIRMATION
COMPLETED
DISPUTED
CANCELLED
```

## `payments`
```text
id UUID PK
booking_id UUID FK
amount NUMERIC
currency TEXT DEFAULT 'PKR'
state TEXT
is_demo BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

States:
```text
PENDING
AUTHORIZED
PROTECTED
RELEASE_PENDING
RELEASED
REFUND_PENDING
REFUNDED
DISPUTED
```

Do not call this legal escrow unless a licensed setup exists.

## `repair_records`
```text
id UUID PK
home_id UUID FK
asset_id UUID NULL FK
incident_id UUID FK
booking_id UUID NULL FK
title TEXT
work_done TEXT
parts_replaced JSONB
amount_paid NUMERIC NULL
provider_name TEXT NULL
completed_at TIMESTAMPTZ
warranty_days INT NULL
warranty_expires_at TIMESTAMPTZ NULL
before_images JSONB
after_images JSONB
notes TEXT NULL
created_at TIMESTAMPTZ
```

## `reviews`
```text
id UUID PK
booking_id UUID FK
rating INT
comment TEXT NULL
created_at TIMESTAMPTZ
```

---

# 9. API contracts

All endpoints:
```ts
type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};
```

Resident:
- `POST /api/incidents`
- `POST /api/incidents/:id/message`
- `POST /api/incidents/:id/image`
- `POST /api/incidents/:id/diy/start`
- `POST /api/incidents/:id/diy/respond`
- `POST /api/incidents/:id/service-request`
- `GET /api/service-requests/:id/offers`
- `POST /api/bookings`
- `POST /api/bookings/:id/confirm-completion`
- `GET /api/history`

Provider:
- `GET /api/provider/requests`
- `POST /api/provider/requests/:id/offer`
- `POST /api/provider/jobs/:id/status`
- `POST /api/provider/jobs/:id/complete`

---

# 10. Safety implementation

Create `lib/safety/rules.ts`.

Example patterns:
```ts
const HIGH_RISK_PATTERNS = [
  /smell.*gas/i,
  /gas.*smell/i,
  /burning.*smell/i,
  /spark/i,
  /smoke/i,
  /exposed.*wire/i,
  /water.*socket/i,
  /socket.*water/i
];
```

Flow:
```text
new user message
    |
deterministic rules
    |
AI safety classifier
    |
merge result
    |
emergency? -> block normal troubleshooting
           -> show emergency UI
otherwise  -> continue triage
```

Emergency UI:
- hazard summary
- Stop troubleshooting
- safe immediate actions
- prohibited actions
- professional/emergency escalation

---

# 11. Islamabad-specific UX

Seed area options:
```text
F-6
F-7
F-8
F-10
F-11
G-8
G-9
G-10
G-11
G-13
G-15
I-8
I-9
I-10
E-11
H-8
Bani Gala
Bahria Town
DHA
PWD
Gulberg Greens
Other
```

Local category cards:
- AC
- Plumbing
- Electrical
- Water motor
- Geyser
- UPS / inverter
- Solar
- Appliance

Primary demo language: English.
Optional: Roman Urdu text toggle.
Urdu voice is not a dependency.

---

# 12. Demo provider data

Use fictional seeded providers. Do not scrape random phone numbers.

Seed at least:
- 4 plumbers
- 4 electricians
- 4 AC technicians
- 2 water pump/geyser technicians
- 2 appliance technicians

Each provider:
- name
- trade
- rating
- completed jobs
- verified flag
- areas covered
- typical availability

Provider dashboard must allow a live offer to be submitted.

---

# 13. Payment protection

For this contest, build the trust workflow, not payment compliance infrastructure.

When an offer is accepted show:
```text
Estimated service: PKR 3,000
Booking / visit charge: PKR 800
Payment status: Protected
```

Make clear:
- amount agreed
- scope
- parts inclusion
- what can change
- extra work requires approval
- provider is paid after completion confirmation in the demo state model

## Change order
Provider submits:
```ts
{
  reason: "Drain pipe needs replacement",
  additional_amount: 1200,
  note: "Part cost + installation"
}
```

Customer sees:
**Additional work requested: PKR 1,200**
Buttons:
- Approve
- Decline

No silent price changes.

---

# 14. Home History

This is a first-class screen.

Example:
```text
Kitchen Sink
27 Sep 2026

Problem:
Leak under sink

Repair:
P-trap connection replaced

Provider:
Capital Plumbing Services

Paid:
PKR 3,200

Warranty:
7 days

Status:
Completed
```

Features:
- filter by room/category
- amount spent
- warranties
- repeated issues
- incident transcript
- repair photos
- parts replaced

Warranty alert:
```text
This may relate to a repair completed 18 days ago.
Warranty remaining: 12 days.
```

CTA:
**Review previous repair**

---

# 15. Landing page copy

## Hero
**Something broke at home? Know what to do next.**

Avero asks the right questions, checks for safety risks, guides simple repairs, and connects Islamabad residents to the right professional when needed.

Buttons:
- Check a home problem
- See how it works

Trust line:
**Built for homes in Islamabad**

## Problem
**The hard part is often not finding a technician. It is knowing whether you need one.**

Cards:
- Can I safely fix this myself?
- Which technician do I actually need?
- Is this dangerous enough to stop and get help now?

## Why Islamabad
Suggested wording:

> Islamabad has an active home-services market, but the repair journey is still fragmented. Residents may begin with referrals, calls, WhatsApp messages or service platforms, while the first decision remains the same: what is actually wrong and what should happen next? Avero is designed around that first-response gap, then carries the issue through repair and history.

Do not say Islamabad has no reliable service platforms.

---

# 16. Demo mode

Environment:
`NEXT_PUBLIC_DEMO_MODE=true`

Add a discreet Demo Scenarios control.

## Scenario 1: Technician
"Kitchen sink leaking when water runs"

Expected:
TECHNICIAN -> plumbing -> request -> offers -> booking -> payment -> history

## Scenario 2: DIY
"AC airflow weak, filter appears dirty, no electrical warning signs"

Expected:
DIY -> guided filter check -> resolved

## Scenario 3: Emergency
"Socket buzzing and burning smell"

Expected:
EMERGENCY immediately

If no provider offers arrive after 10 seconds:
button **Load demo offers**

Clearly label them demo offers.

---

# 17. Judge demo script

Target 3 to 4 minutes.

## 0:00 to 0:20
> "When something breaks at home in Islamabad, residents often know the symptom but not what it means. Do I fix it, call someone, or is it dangerous? Existing booking services usually start after that decision. Avero starts before it."

## 0:20 to 1:15
Live F-10 sink leak triage.

Show adaptive questions and safety indicator.

## 1:15 to 1:35
Decision:
- Technician recommended
- observed facts
- concern
- likely issue
- trade needed

## 1:35 to 2:10
Structured request.
Open provider dashboard in another tab.
Submit one offer live.
Load two demo offers.
Return and compare.

## 2:10 to 2:40
Book.
Show agreed amount, arrival, warranty and protected payment state.

## 2:40 to 3:05
Provider completes repair.
Resident confirms.

## 3:05 to 3:25
Show new Home History record and an older AC record with active warranty.

## 3:25 to 3:40
Quick emergency proof:
"The socket is buzzing and I smell burning."

Show immediate override.

Finish:
> "Avero turns the first confusing minutes of a home problem into a clear path from incident to resolution."

---

# 18. Do not waste time on

Until core is polished, skip:
- nationwide coverage
- native mobile app
- call center
- autonomous Urdu technician phone calls
- complex maps
- real escrow
- 50 repair categories
- blockchain
- custom ML training
- advanced admin analytics
- production KYC

---

# 19. GitHub structure

```text
avero/
|-- app/
|   |-- page.tsx
|   |-- app/
|   |-- incident/
|   |-- provider/
|   |-- booking/
|   |-- history/
|   `-- api/
|-- components/
|   |-- triage/
|   |-- safety/
|   |-- diy/
|   |-- providers/
|   |-- payments/
|   `-- history/
|-- lib/
|   |-- ai/
|   |   |-- provider.ts
|   |   |-- intake.ts
|   |   |-- question-planner.ts
|   |   |-- safety-classifier.ts
|   |   |-- triage.ts
|   |   |-- diy.ts
|   |   |-- service-request.ts
|   |   `-- offer-normalizer.ts
|   |-- safety/
|   |   `-- rules.ts
|   |-- scoring/
|   |   `-- offers.ts
|   |-- supabase/
|   `-- validation/
|-- supabase/
|   |-- migrations/
|   `-- seed.sql
|-- types/
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- AI_SAFETY.md
|   |-- DEMO_SCRIPT.md
|   |-- TEST_CASES.md
|   `-- CITY_RESEARCH.md
|-- public/
|-- .env.example
|-- README.md
`-- package.json
```

---

# 20. Build order for Cursor

Do not build everything in one prompt.

## Phase 0: Foundation
- initialize Next.js
- strict TypeScript
- Tailwind/component library
- Supabase setup
- env validation
- route skeleton
- shared types
- seed framework
- make Vercel build pass

Exit: deployed shell works.

## Phase 1: Database
- migrations
- Islamabad locations
- demo home
- demo providers
- seed Home History
- typed DB helpers

Exit: dashboard loads persistent seed data.

## Phase 2: Incident UI
- new incident form
- conversation page
- message persistence
- status UI

Exit: text-only conversation persists after refresh.

## Phase 3: AI triage
- provider abstraction
- parser
- adaptive question planner
- structured outputs
- Zod validation
- retry malformed JSON

Exit: test cases reach expected decisions.

## Phase 4: Safety
- deterministic rules
- AI safety classifier
- override
- emergency UI

Exit: burning socket fixture always blocks DIY.

## Phase 5: DIY
- plan generation
- one-step UI
- responses
- reassessment
- escalation

Exit: one case resolves, one escalates.

## Phase 6: Marketplace
- service request
- matching
- provider dashboard
- offers
- scoring
- comparison

Exit: live offer appears to resident.

## Phase 7: Booking and payment
- booking state machine
- payment demo state machine
- change-order approval
- completion confirmation

Exit: booking can reach Completed.

## Phase 8: Home History
- create repair record
- history timeline
- warranty logic
- previous issue context

Exit: completed repair appears immediately in history.

## Phase 9: Multimodal and voice
Only after core is stable.
- image upload
- image context
- optional voice transcription

Exit: failure of voice/image never breaks text flow.

## Phase 10: Polish
- loading
- errors
- empty states
- responsive mobile
- accessibility
- demo mode
- reset
- README
- production build

---

# 21. Required tests

Unit:
- emergency electrical fixture -> Emergency
- safe low-risk fixture -> DIY
- specialist fixture -> Technician
- missing warranty -> null
- deterministic offer ranking
- warranty date calculation

Playwright:
1. incident -> technician -> offer -> booking -> repair -> history
2. incident -> DIY -> resolved
3. incident -> DIY -> escalated
4. incident -> emergency
5. repeat incident -> warranty alert
6. provider submits offer
7. extra charge requires approval
8. demo reset

---

# 22. Failure handling

## AI timeout
Show retry plus safe guided fallback.

## Malformed AI output
- Zod reject
- automatic retry once
- safe fallback

## No offers
Button: **Load demo offers**

## Voice fails
Text still works.

## Image fails
Triage continues without image.

The live demo must never depend on one fragile integration.

---

# 23. Deployment checklist

Before submission:
- lint passes
- typecheck passes
- tests pass
- production build passes
- Vercel URL works in incognito
- demo resident works without email verification
- seed data exists
- no secrets committed
- mobile checked
- desktop Chrome checked
- empty/loading/error states checked
- emergency manually tested
- demo reset tested
- provider portal tested separately
- Home History persists
- README setup works

---

# 24. Honest limitations

State:
- Avero is not a substitute for emergency services.
- AI diagnosis can be uncertain.
- risky cases are deliberately escalated.
- demo provider data is seeded.
- payment protection is a prototype workflow, not licensed escrow.
- production provider verification/payments require operational partners.
- this build is focused on Islamabad.

---

# 25. City research notes

Maintain `docs/CITY_RESEARCH.md`.

Important positioning:
- Islamabad uses a sector-based urban structure, so area-based service matching is intuitive.
- Current local service providers advertise verified workers, pricing transparency and service guarantees, showing real demand for trust and coordination.
- Technician booking is not itself novel in Islamabad.
- Avero's gap is the first-response decision: what is wrong, how urgent it is, whether DIY is safe, and what trade is needed.

Only use sourced quantitative claims.

---

# 26. Final definition

Avero is not:
- a directory
- a generic chatbot
- a list of repair tutorials
- only a technician marketplace

Avero is:
**a city-specific AI first-response and coordination layer for household incidents.**

Flow:
```text
Something broke
     |
Understand it
     |
Check safety
     |
Resolve safely or find help
     |
Book and protect the job
     |
Remember the repair
```

---

# 27. Master Cursor kickoff prompt

```text
You are the lead engineer building Avero from scratch for the Banao Imaginathon.

Read AVERO_ISLAMABAD_IMAGINATHON_BUILD_SPEC.md completely before modifying code.

Avero is an AI home incident first responder designed specifically for Islamabad. The user reports a household problem in natural language. The system asks adaptive questions, runs a separate safety gate, and classifies the case as DIY, TECHNICIAN, or EMERGENCY. DIY cases receive one-step-at-a-time guidance with reassessment. Technician cases become structured service requests, are matched to seeded Islamabad demo providers, receive offers, and can be booked through a protected-payment state-machine prototype. Completed repairs are saved to Home History with warranty information. Future incidents should use relevant Home History context.

Use:
- Next.js
- TypeScript strict mode
- Tailwind
- clean component library
- Supabase PostgreSQL/Auth/Storage
- Zod for API and AI boundaries
- Vercel-compatible architecture
- Playwright for critical end-to-end tests

Critical rules:
1. Text input must always work even if voice/images fail.
2. Do not build one giant AI prompt.
3. Safety is a hard gate using deterministic rules plus AI classification.
4. Do not expose hidden model reasoning.
5. Validate every AI structured output with Zod.
6. Never invent missing provider quote information.
7. Demo providers must be clearly seeded/fictional.
8. Payment protection is a prototype state machine, not licensed escrow.
9. Islamabad must be visible through areas, coverage and local service categories.
10. Home History is core.
11. Build loading, error, empty and retry states.
12. The app must deploy cleanly on Vercel.

Do not implement everything at once.

Implement Phase 0 only:
- initialize architecture
- install dependencies
- create route skeleton
- create shared types
- configure env validation
- configure Supabase clients
- create .env.example
- create README setup
- make lint/typecheck/build pass

After Phase 0, stop and report:
- files created
- commands run
- what works
- what remains
- decisions needing approval

Wait for instruction before Phase 1.
```

---

# 28. Submission-ready acceptance test

A judge must be able to open the deployment and complete:

```text
F-10 resident
-> reports sink leak
-> Avero asks adaptive questions
-> Technician decision
-> structured plumbing request
-> provider offer
-> comparison
-> booking
-> protected payment state
-> repair completed
-> Home History record created
```

And separately enter:

```text
"The socket is buzzing and I smell burning."
```

and receive an immediate emergency safety override.

If these two flows are polished, fast and visibly Islamabad-specific, the product directly demonstrates city understanding, impact, original thinking, execution and clarity.
