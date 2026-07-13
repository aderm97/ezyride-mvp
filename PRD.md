# Ezyride — Product Requirements Document

### Web Application & API MVP · Premium 100% Electric Airport E-Hailing

| | |
|---|---|
| **Product** | Ezyride Web MVP (API + Demonstration UI) |
| **Brand essence** | *Frictionless Luxury* — a silent, seamless transition from flight to ground |
| **Document owner** | Product / Architecture / Brand |
| **Status** | Draft v1.0 — for prototype build |
| **Date** | 2 July 2026 |
| **Scope of this doc** | Web-only MVP demonstrating core ride lifecycle for VIP Traveler + Chauffeur views |

---

## 1. Executive Summary

Ezyride is a premium, **100% electric** e-hailing platform built around a single specialised journey: the **airport transfer**. Where mass-market ride-hailing optimises for volume and price, Ezyride optimises for the *arrival experience* — a rested traveller stepping off a flight into a silent, fully-charged EV, met by a professional chauffeur who already knows their flight landed early.

This document specifies the **Web Application API MVP** — a functional prototype, not the production platform. Its purpose is to **demonstrate the core Ezyride ride lifecycle** end-to-end in a browser, simulating both the **VIP Traveler** and **Professional EV Chauffeur** experiences, backed by a robust, well-documented API and a state-of-the-art web UI that embodies the brand.

- **What it proves:** authentication, geospatial pickup handling, flight-aware airport metadata, EV tier selection, fare estimation, ride request, driver matching via a reliable state machine, and ride completion.
- **What it is not:** a payments product, a native mobile app, or a routing/dispatch optimisation engine.
- **Primary audience for the MVP:** internal stakeholders, prospective investors, and pilot-launch partners viewing a browser-based demonstration.
- **Design mandate:** every pixel must read as elite. The prototype must abandon generic dashboard templates and render Ezyride's custom two-tone brand architecture flawlessly, because for a luxury brand the *demo is the product*.

**Success in one line:** a stakeholder books a VIP airport pickup, watches a chauffeur get matched and complete the ride in real time, and never once perceives the interface as a prototype.

---

## 2. Core User Personas

### 2.1 The Premium Traveler (Rider) — "Adaora"

| Attribute | Detail |
|---|---|
| **Profile** | 38, senior executive / frequent international flyer. Time-poor, comfort-rich. |
| **Context** | Lands after a long-haul flight. Does not want to queue, negotiate, or wait. |
| **Needs** | Certainty (a car *will* be there), calm (no friction), status (a premium, discreet experience). |
| **Frustrations with incumbents** | Surge pricing, drivers cancelling, standing at the wrong terminal, combustion-engine cabs. |
| **What "luxury" means to her** | Not gold trim — it's *the absence of friction*. Fixed price known in advance. Chauffeur waiting. Silence. |
| **In this MVP she will** | Sign in, set an airport pickup with a flight number, choose an EV tier, see a fixed fare, request the ride, and watch it progress to completion. |

### 2.2 The Professional EV Chauffeur (Driver) — "Daniel"

| Attribute | Detail |
|---|---|
| **Profile** | 45, licensed professional chauffeur operating a premium EV. Brand-trained, not gig-casual. |
| **Context** | Waits in an airport staging zone; accepts curated, high-value airport jobs. |
| **Needs** | Clear, unambiguous ride requests; reliable status transitions; passenger + flight context up front. |
| **Frustrations with incumbents** | Ambiguous pickup points, no flight visibility, chaotic queues, low-value short hops. |
| **What "professional" means to him** | Knowing exactly who, where, and when — and being trusted to represent a premium marque. |
| **In this MVP he will** | Sign in to a chauffeur view, receive a matched request, accept it, and drive the state machine forward (arrive → start → complete). |

---

## 3. Scope of the MVP

### 3.1 In-Scope (must be demonstrable end-to-end)

- **User authentication** — email/password (or magic-link stub) with JWT sessions; role-based (`rider` vs `chauffeur`).
- **Location & geospatial handling** — pickup/drop-off coordinates via **real browser geolocation** *or* a mocked location picker; distance/duration estimate between two points.
- **Flight-tracking & airport pickup metadata** — attach a flight number, terminal, and (mocked) scheduled/estimated arrival time to a ride; pickup time follows the flight.
- **EV vehicle tier selection** — the five brand tiers: **Economy, Standard, Executive, Luxury, Premium SUV**.
- **Fare estimation** — deterministic quote from tier + distance + airport surcharge, returned before the ride is requested.
- **Ride requesting** — a rider creates a ride from a validated quote.
- **Driver matching (state machine)** — a reliable, explicit lifecycle (see §6.4) matching a request to an available chauffeur.
- **Basic ride completion** — arrive, start, complete, with a final fare and receipt summary object.
- **Two-tone brand UI** — full Milk White / Deep Blue theme system (see §4) across both personas' web views.

### 3.2 Out-of-Scope (explicitly excluded from this MVP)

- ❌ **Complex payment gateways** — no Stripe/card capture/settlement. Fare is computed and displayed only; payment is stubbed as "settled."
- ❌ **In-app chat / messaging** between rider and chauffeur.
- ❌ **Advanced routing / dispatch optimisation** — no live traffic routing, no multi-driver auction, no ETA re-optimisation.
- ❌ **Native mobile apps** (iOS/Android) — web only for now; the UI is responsive, but no app store build.
- ❌ **Real-time live GPS map streaming** — status transitions are simulated; a live map trail is a fast-follow, not MVP.
- ❌ **Ratings, loyalty, promo codes, corporate billing accounts.**

> **Guardrail:** any request to add scope must be measured against the demo goal in §1. If it does not help a stakeholder *see the ride lifecycle work beautifully*, it is a fast-follow.

---

## 4. State-of-the-Art UI/UX Guidelines (Strict Brand Alignment)

> The prototype's interface is the brand's first handshake. It must feel like a piece of premium industrial design, not an admin panel. The existing landing page (`index.html` / `styles.css`) is the canonical reference for tokens and treatments — the app UI must extend it, not diverge from it.

### 4.1 Theme Architecture — Strict Two-Tone

A hard rule: **only two tones exist.** Brand Blue and Milk White. There are **no default UI grays** (no `#121212`, no `#333`, no Tailwind `slate-*` as chrome) and **no pure black or pure white** surfaces. Every gray you're tempted to use must instead be a *translucent tint of Brand Blue or Milk White*.

**Canonical tokens (already implemented as CSS custom properties):**

| Token | Milk White State (Light) | Deep Blue State (Dark) |
|---|---|---|
| `--brand-blue` | `#0F2346` | `#0F2346` |
| `--milk` | `#FAF9F6` | `#FAF9F6` |
| `--bg` (canvas) | `#FAF9F6` warm milk | `#0F2346` deep blue |
| `--text` | Deep Blue `#0F2346` | Milk White `#FAF9F6` |
| `--text-muted` | `rgba(15,35,70,0.72)` | `rgba(250,249,246,0.75)` |
| `--border` | `rgba(15,35,70,0.16)` | `rgba(250,249,246,0.18)` |
| `--accent` | Deep Blue | Milk White |
| `--on-accent` | Milk White | Deep Blue |

- **Light = "Milk White State":** warm Milk White canvas; Deep Blue text, borders, and minimalist icons.
- **Dark = "Deep Blue State":** Deep Blue canvas; Milk White text, borders, and minimalist icons.
- **Toggle:** persisted (`localStorage`), respects `prefers-color-scheme`, and is resolved **before first paint** (inline head script) to prevent a flash of the wrong theme. This is already implemented — reuse it.
- **Transitions:** theme swaps animate `background-color`/`color` (~0.45s, brand easing `cubic-bezier(0.22, 1, 0.36, 1)`), never instant/jarring.

### 4.2 Logo Integration (4K JPEG, No Transparency)

The master logo is a **4K JPEG on a solid white ground** with no alpha channel. Developers must never let that white box show as a hard rectangle. Two sanctioned techniques (both already proven in the header/footer):

- **Milk White State →** apply `mix-blend-mode: multiply` to the `<img>`. The white ground multiplies *into* the milk canvas and disappears; only the mark remains.
  ```css
  .brand__badge img { mix-blend-mode: multiply; }
  ```
- **Deep Blue State →** `multiply` would darken the mark against navy, so instead **frame the JPEG inside a premium Milk White "pill" container** — a rounded emblem plate. The JPEG then multiplies cleanly into the pill.
  ```css
  [data-theme="dark"] .brand__badge {
    background: var(--milk);
    padding: 0.3rem 0.45rem;
    border-radius: 10px;
  }
  ```
- **Production note:** commission a transparent **SVG/PNG** wordmark for post-MVP; the JPEG techniques are a deliberate, elegant stopgap for the prototype only. Always export the app-ready logo asset at 2× and set explicit `width`/`height` to avoid layout shift.

### 4.3 Aesthetic Direction

- **Editorial minimalism** — treat screens like a luxury magazine spread: strong typographic hierarchy, few elements, high confidence. Content earns its place or it's cut.
- **Glassmorphism (subtle, surface-layer only)** — raised surfaces (booking card, fleet panels, ride-status sheet) use translucent fills + `backdrop-filter: blur(16–18px)` over the canvas. **Neumorphism is banned** — no dual inset/outset "soft plastic" shadows anywhere.
- **Typography** — **Space Grotesk** for display/geometric headings with wide tracking on eyebrows/labels (`letter-spacing: 0.12–0.22em`, uppercase); **Inter** for body. Tabular numerals for fares/specs.
- **Macro-whitespace** — generous, deliberate negative space (`--section-pad: clamp(5.5rem, 6vw + 3rem, 9rem)`). Never crowd. Whitespace *is* the luxury signal.
- **Skeleton loaders** — while quotes/matching resolve, show brand-tinted skeletons (shimmer of `--bg-raised`), never spinners-on-gray. Perceived performance is part of "frictionless."
- **Buttery fluid animations** — all motion uses the brand easing; entrance reveals via `IntersectionObserver`; every animation **must respect `prefers-reduced-motion`** (already wired).
- **Iconography** — minimalist line icons only, `stroke: currentColor` so they invert with the theme automatically.

### 4.4 Recommended Frontend Framework

- **Recommendation: Next.js (App Router, React, TypeScript).**
  - **Why:** first-class Vercel hosting for a zero-friction demo, SSR/SSG for a fast luxurious first paint, API routes available for lightweight stubs, and a mature ecosystem (Framer Motion for buttery transitions, TanStack Query for API state).
  - Style with CSS Variables + CSS Modules (or Tailwind configured to **expose only brand tokens** — no default palette) to hard-enforce the two-tone rule.
- **Acceptable alternative:** **Nuxt (Vue 3)** if the team prefers Vue — same rationale, deploys equally well.

---

## 5. Functional Requirements (User Stories)

> Tone note: copy throughout is calm, precise, and premium. "Your chauffeur is on the way," never "Driver en route lol."

### 5.1 Premium Traveler (Rider) Flow

- **Authentication** — *As a traveler, I want to sign in securely so my trips and preferences are recognised the moment I arrive.*
- **Airport pickup with flight** — *As a traveler landing at an airport, I want to enter my flight number and terminal so my pickup automatically tracks my real arrival time, even if the flight is early or delayed.*
- **Location** — *As a traveler, I want to set my pickup and drop-off via the map/geolocation so I never have to describe where I am.*
- **Tier selection** — *As a traveler, I want to choose from five clearly-differentiated EV classes (Economy → Premium SUV) so the car matches the occasion and my luggage.*
- **Fare certainty** — *As a traveler, I want to see one fixed, all-in fare before I confirm so I never face a surge or a surprise.*
- **Request** — *As a traveler, I want to request the ride in one confident tap and receive immediate confirmation that a chauffeur is being assigned.*
- **Live status** — *As a traveler, I want to watch clear status updates (Matched → Chauffeur arriving → In transit → Arrived) so I always know exactly what is happening, with skeleton loaders — never a blank screen.*
- **Completion** — *As a traveler, I want a clean end-of-trip summary (route, tier, chauffeur, final fare) so the journey closes as elegantly as it began.*

### 5.2 Professional EV Chauffeur (Driver) Flow

- **Authentication** — *As a chauffeur, I want to sign in to my professional view and set myself available so I can receive curated airport jobs.*
- **Receive request** — *As a chauffeur, I want an incoming request that shows the traveler, tier, pickup point, terminal, and flight status up front so I have full context before I accept.*
- **Accept / decline** — *As a chauffeur, I want to accept (or decline) a matched request so control of the job is explicit and unambiguous.*
- **Drive the lifecycle** — *As a chauffeur, I want to advance the ride status (I've arrived → trip started → trip completed) so both the traveler and the system stay perfectly in sync.*
- **Flight awareness** — *As a chauffeur, I want the pickup time to reflect the flight's real arrival so I'm never early, late, or idling at the wrong time.*
- **Close out** — *As a chauffeur, I want the completed ride to show the final fare and route so the job ends cleanly and professionally.*

---

## 6. API Architecture & Core Endpoints

### 6.1 Style & Conventions

- **REST over HTTPS, JSON** — REST is the right call for an MVP: simple, universally demoable, trivially documented with OpenAPI. (GraphQL is deferred; it adds schema/tooling overhead the MVP doesn't need.)
- **Base path:** `/api/v1`. **Auth:** `Authorization: Bearer <JWT>`. **Errors:** consistent `{ "error": { "code", "message" } }` with correct HTTP status codes.
- **IDs:** UUIDs. **Timestamps:** ISO-8601 UTC. **Money:** integer minor units + `currency`.
- **Docs:** auto-generated **OpenAPI 3.1 / Swagger UI** served at `/api/docs` — the interactive spec is itself a demo artifact.

### 6.2 Recommended Backend Stack

| Layer | Recommendation | Why it fits the MVP |
|---|---|---|
| **Runtime / framework** | **Python + FastAPI** (async) | Auto OpenAPI docs, Pydantic validation, fast to build, first-class geospatial + async. *Alt: Node.js + Express/NestJS if the team is JS-first and wants one language across stack.* |
| **Database** | **PostgreSQL + PostGIS** | Relational integrity for the ride state machine + native geospatial types/queries (distance, nearest available chauffeur). |
| **Auth** | JWT (access + refresh), hashed passwords (argon2/bcrypt) | Stateless, standard, demo-friendly. Supabase Auth is an acceptable managed shortcut. |
| **Realtime status** | WebSocket channel (or short polling for MVP) | Push status transitions to rider/chauffeur views. Polling is an acceptable MVP fallback. |
| **Flight data** | Mocked provider service (interface-ready for AeroDataBox/FlightAware later) | Keeps the MVP self-contained; swap the adapter post-MVP. |

### 6.3 Core Endpoints

| Method | Endpoint | Auth | Description | Key payload / notes |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Create rider or chauffeur account | `{ email, password, role }` |
| `POST` | `/api/v1/auth/login` | Public | Exchange credentials for tokens | → `{ accessToken, refreshToken, user }` |
| `GET` | `/api/v1/me` | Bearer | Current user profile + role | — |
| `GET` | `/api/v1/fleet/tiers` | Public | List the five EV tiers + capacity/luggage/base pricing | Drives the tier selector UI |
| `GET` | `/api/v1/airports` | Public | Supported airports + terminals | For pickup metadata |
| `GET` | `/api/v1/flights/{flightNo}` | Bearer | (Mocked) flight status: scheduled/estimated arrival, terminal | Powers flight-aware pickup |
| `POST` | `/api/v1/quotes` | Bearer | Fare estimate for a route + tier | `{ pickup{lat,lng}, dropoff{lat,lng}, tier, airport{code,terminal}, flightNo? }` → `{ quoteId, fare, distanceKm, etaMin, breakdown }` |
| `POST` | `/api/v1/rides/request` | Bearer (rider) | Create a ride from a valid quote | `{ quoteId, passengers, flightNo?, notes? }` → ride in `SEARCHING` |
| `GET` | `/api/v1/rides/{id}` | Bearer | Poll ride state + assigned chauffeur/vehicle | Primary status endpoint |
| `GET` | `/api/v1/rides` | Bearer | List rides for current user (role-scoped) | Rider history / chauffeur queue |
| `GET` | `/api/v1/rides/available` | Bearer (chauffeur) | Open requests matchable to this chauffeur | Nearest-first via PostGIS |
| `PATCH` | `/api/v1/rides/{id}/accept` | Bearer (chauffeur) | Chauffeur accepts a matched request | `SEARCHING/MATCHED → ACCEPTED` |
| `PATCH` | `/api/v1/rides/{id}/arrive` | Bearer (chauffeur) | Mark chauffeur arrived at pickup | `ACCEPTED → ARRIVED` |
| `PATCH` | `/api/v1/rides/{id}/start` | Bearer (chauffeur) | Begin the journey | `ARRIVED → IN_PROGRESS` |
| `PATCH` | `/api/v1/rides/{id}/complete` | Bearer (chauffeur) | Complete ride; finalise fare | `IN_PROGRESS → COMPLETED` → receipt |
| `PATCH` | `/api/v1/rides/{id}/cancel` | Bearer | Cancel (rider or chauffeur), pre-start | → `CANCELLED` |
| `WS` | `/api/v1/rides/{id}/stream` | Bearer | Real-time status push (optional; poll fallback) | Emits state-transition events |

**Representative payloads**

```jsonc
// POST /api/v1/quotes  →  200
{
  "quoteId": "q_9f2a…",
  "tier": "executive",
  "fare": { "amount": 5900, "currency": "USD" },   // integer minor units
  "distanceKm": 21.4,
  "etaMin": 27,
  "airport": { "code": "LOS", "terminal": "T2" },
  "breakdown": { "base": 4500, "distance": 1100, "airportSurcharge": 300 }
}

// GET /api/v1/rides/{id}  →  200
{
  "id": "ride_3c…",
  "status": "ACCEPTED",
  "tier": "executive",
  "rider": { "id": "u_…", "name": "Adaora O." },
  "chauffeur": { "id": "u_…", "name": "Daniel K.", "rating": 4.9,
                 "vehicle": { "model": "Tesla Model S", "plate": "EZY-114", "color": "Deep Blue" } },
  "pickup":  { "lat": 6.5774, "lng": 3.3213, "label": "MMIA Terminal 2, Arrivals" },
  "dropoff": { "lat": 6.4281, "lng": 3.4219, "label": "Eko Hotel" },
  "flight":  { "number": "BA075", "status": "LANDED", "estimatedArrival": "2026-07-02T18:40:00Z" },
  "fare": { "amount": 5900, "currency": "USD" }
}
```

### 6.4 Ride State Machine (the reliability core)

The matching + lifecycle logic is the single most important thing to get *provably correct*. Transitions are explicit, one-directional (except cancel), and each is guarded by role + current-state checks server-side.

```
                 rider requests
   [SEARCHING] ─────────────────► (matcher assigns) ─► [MATCHED]
        │                                                  │
        │                                       chauffeur  │ accept
        │                                                  ▼
        │                                             [ACCEPTED]
        │                                                  │ arrive
        │                                                  ▼
        │                                              [ARRIVED]
        │                                                  │ start
        │                                                  ▼
        │                                            [IN_PROGRESS]
        │                                                  │ complete
        ▼                                                  ▼
   [CANCELLED] ◄── cancel (any pre-start state) ──   [COMPLETED]
```

- **States:** `SEARCHING → MATCHED → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`, plus terminal `CANCELLED` (only from any pre-`IN_PROGRESS` state) and `NO_MATCH` (timeout with no available chauffeur).
- **Guards:** the server rejects illegal transitions (e.g. `start` before `ARRIVED`) with `409 Conflict` — never trust the client. Only the assigned chauffeur may advance a ride; only rider/assigned-chauffeur may cancel.
- **Matching (MVP):** on `request`, find the nearest available chauffeur (PostGIS `ST_Distance`) whose vehicle matches the requested tier → set `MATCHED`. If none within timeout → `NO_MATCH`. (A demo "seed chauffeur" ensures matches always succeed on stage.)

---

## 7. Hosting & Deployment Strategy

Goal: a **zero-friction, always-on, shareable demo URL** with a modern DX and a clean path to scale — not a hand-rolled server.

| Component | Recommended platform | Why it fits an MVP |
|---|---|---|
| **Web UI (Next.js)** | **Vercel** | Native Next.js host: push-to-deploy from Git, instant global CDN, automatic HTTPS, and **per-branch preview URLs** — every demo iteration gets its own link. Generous free/hobby tier. |
| **API (FastAPI)** | **Render** (or **Railway** / **Fly.io**) | Deploys a containerised Python service from Git with managed TLS, health checks, and autoscaling. Simpler than raw AWS for an MVP; no infra team required. |
| **Database (Postgres + PostGIS)** | **Supabase** (or Render Postgres / Neon) | Managed Postgres with **PostGIS available**, plus optional built-in Auth + Realtime that can shortcut MVP work. Point-in-time backups included. |
| **Object/asset hosting** | Vercel static assets / Supabase Storage | Serve the 4K logo + imagery from the CDN with cache headers. |
| **Secrets / config** | Platform env vars (Vercel + Render dashboards) | No secrets in Git; separate preview vs production values. |

**Recommended topology**

```
        ┌─────────────┐        HTTPS/JSON        ┌──────────────┐
Browser │  Next.js    │ ───────────────────────► │  FastAPI     │
(2 views)│  on Vercel  │ ◄─────────────────────── │  on Render   │
        └─────────────┘   (WS/poll for status)    └──────┬───────┘
                                                          │ SQL + PostGIS
                                                   ┌──────▼───────┐
                                                   │  Postgres    │
                                                   │  (Supabase)  │
                                                   └──────────────┘
```

- **CI/CD:** GitHub → Vercel (frontend) and GitHub → Render (backend) auto-deploy on merge to `main`; PRs get preview environments.
- **Environments:** `preview` (per-branch) + `production` (demo). Seed script provisions demo rider, demo chauffeur, airports, and fleet tiers so any fresh environment is instantly demoable.
- **Why not AWS now:** ECS/RDS/CloudFront is the right *scale* answer but the wrong *MVP* answer — it front-loads infra work that Vercel + Render + Supabase abstract away. Keep AWS as the documented migration target once traffic/compliance demands it.

---

## 8. Success Metrics

The MVP succeeds if a live demo is **fast, reliable, and visibly premium.** Targets:

### 8.1 API Latency & Performance
- **p95 response time < 300 ms** for core reads (`GET /rides/{id}`, `/fleet/tiers`, `/quotes`) under demo load.
- **Quote generation < 250 ms** end-to-end (deterministic fare, no external blocking calls on stage).
- **Status propagation < 1 s** from chauffeur `PATCH` action to the rider view reflecting the new state.
- **Cold-start mitigated** — keep the API warm during demos (Render always-on / minimal instance).

### 8.2 State Machine Reliability
- **100% of illegal transitions rejected** with `409` (verified by an automated transition test suite).
- **Zero orphaned/stuck rides** across repeated full-lifecycle runs (`SEARCHING → COMPLETED`).
- **Deterministic matching on stage** — the seeded demo chauffeur is matched every time; no "no driver found" surprises.
- **Idempotent transitions** — repeating a `PATCH` doesn't corrupt state.

### 8.3 Visual UI Rendering & Brand Impact
- **No flash of unstyled/wrong theme (FOUC/FOWT)** — theme resolves before first paint; verified light + dark.
- **First Contentful Paint < 1.5 s**, **Lighthouse ≥ 90** for Performance, Accessibility, Best Practices.
- **Zero CLS from the logo/imagery** — explicit dimensions everywhere; logo blend/pill treatment renders correctly in both themes.
- **Brand-fidelity audit passes** — *no default grays, no pure black/white*; glassmorphism present, neumorphism absent; skeleton loaders (never spinners on gray); `prefers-reduced-motion` honoured.
- **Qualitative demo signal (the real test):** stakeholders describe the prototype as *"a finished premium product,"* not *"a demo."*

---

### Appendix A — Alignment with the Existing Prototype
This PRD extends the already-built landing page (`index.html`, `styles.css`, `script.js`), which already implements: the two-tone token system, pre-paint theme resolution, the `mix-blend-mode: multiply` + milk-pill logo treatment, glassmorphic surfaces, Space Grotesk/Inter typography, `IntersectionObserver` reveals, and the five fleet tiers. The app UI should be built as a continuation of that system — same tokens, same easing, same restraint.

### Appendix B — Post-MVP Fast-Follows
Live GPS map trail · transparent SVG logo · real flight-data provider · Stripe payments · native apps · in-app chat · ratings & loyalty · corporate accounts · AWS migration for scale/compliance.
