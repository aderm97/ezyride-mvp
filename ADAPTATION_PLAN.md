# Ezyride — Adaptation & Feature-Extension Plan

**Goal:** Take the working open-source app (`~/Downloads/ezyride-main`), rebrand it to the strict Ezyride two-tone template, and extend it into the airport-EV product described in `PRD.md`.

**Source reviewed:** `C:\Users\BEACON POWER SERVICE\Downloads\ezyride-main\ezyride-main`
**Brand target:** Deep Blue `#0F2346` / Milk White `#FAF9F6` (see `styles.css`, `PRD.md` §4)

---

## 1. What we inherit (reuse as-is)

The open-source app is a genuine head start. Keep its spine:

| Area | Asset | Verdict |
|---|---|---|
| Stack | Next.js 16.2.1, React 19, TypeScript, Tailwind v4, Prisma | ✅ Matches PRD frontend recommendation |
| Auth | JWT + bcrypt (`src/lib/auth-utils.ts`), login/register routes | ✅ Reuse; harden secret handling |
| Ride state machine | `api/rides/[id]/status/route.ts` `validTransitions` map | ✅ Reuse; extend states |
| Race-safe accept | `api/rides/[id]/accept/route.ts` atomic `updateMany` | ✅ Reuse — genuinely good |
| Fare math | haversine in `api/rides/estimate/route.ts` | ✅ Reuse; make tier-aware |
| Maps | `LiveMap` (Leaflet), `RouteInfo`, geocoding via Nominatim | ✅ Reuse |
| External data | AviationStack (flights), Finnhub (ticker) | ✅ Flights → wire into booking; ticker optional |
| Dashboards | `rider/page.tsx`, `driver/page.tsx` polling flows | ✅ Reuse logic; restyle heavily |

## 2. What conflicts with the brand (must change)

| Conflict | Where | Fix |
|---|---|---|
| Obsidian black `#0A0A0A`, charcoal `#1A1A1A/#111` | `globals.css` `:root` + `[data-theme=light]` | Replace token values with Deep Blue / Milk White system |
| Champagne gold `#C9A96E` accent + `shimmer-text`, `btn-glow` | `globals.css` utilities | Remove gold; accent = Deep Blue (light) / Milk White (dark) |
| Hardcoded hex in JSX | `rider/page.tsx` (`bg-[#0A0A0A]`, `bg-[#111111]`, `border-neutral-800`, `bg-blue-500`) | Swap to semantic token classes (`bg-background`, `border-border`, etc.) |
| Flat panels | `.glass-panel`/`.glass-heavy` are flat | Convert surface layers to real glassmorphism (blur + translucency) |
| Inter-only typography | `layout.tsx` | Add **Space Grotesk** display font; keep Inter for body |
| Dark = default | `globals.css` | Keep two-tone; ensure pre-paint theme resolution (already partial via `next-themes`) |

**Rule of thumb:** every `#0A0A0A`/gray/gold in the repo must resolve to a Deep-Blue or Milk-White token. No exceptions — that is the brand's single hard rule.

## 3. Feature gaps vs. the PRD (must build)

| Missing capability | PRD ref | Change required |
|---|---|---|
| **EV tier selection** (Economy→Premium SUV) | §3.1, §5.1 | Add `tier` to `Ride` model; tier picker UI; tier-based `baseFare`/`perKm` (reuse values from `api/seed.py`) |
| **Airport + flight on the ride** | §3.1, §6 | Add `airportCode`, `terminal`, `flightNo` to `Ride`; wire existing flights API into booking |
| **Fixed fare from a real quote** | §5.1 | Rider currently hardcodes `fare: 35.00` — replace with `/rides/estimate` result carrying tier + airport surcharge |
| **Flight-aware pickup** | §5.1/§5.2 | Show flight status in booking + on driver's assignment card |
| **Receipt / completion summary** | §5.1 | Return a receipt object on `COMPLETED` |

---

## 4. Phased execution plan

### Phase 0 — Bootstrap (½–1 day)
- Copy `ezyride-main` into the Ezyride workspace (or a `/app` subfolder); `npm install`; confirm `npm run dev` (port 3007) runs the existing app.
- `git init` + baseline commit so the rebrand is reviewable as a diff.
- **Migrate DB to Postgres + PostGIS (locked decision):**
  - Switch Prisma `datasource` provider `sqlite → postgresql`; set `DATABASE_URL` (local Docker Postgres or Supabase).
  - Enable the PostGIS extension (`CREATE EXTENSION IF NOT EXISTS postgis;`).
  - Re-baseline Prisma migrations against Postgres (the current SQLite `dev.db` is throwaway seed data).
  - Reseed via a Postgres-aware version of `api/seed.py` / `scripts/seed-test-user.ts`.
- Drop in the Ezyride logo assets (`assets/ezyride-logo*.jpg`) with the `mix-blend-mode: multiply` / milk-pill treatment from `styles.css`.

### Phase 1 — Rebrand to two-tone (1–2 days) ← *recommended first executable step*
- Rewrite `globals.css` token blocks: map `--background/--card/--surface/--text/--border/--accent` to Deep Blue & Milk White; delete champagne palette.
- Add Space Grotesk via `next/font` in `layout.tsx`; set `--font-heading`.
- Hunt-and-replace hardcoded hex in `rider/page.tsx` (and any others) → semantic tokens.
- Convert `.glass-panel`/`.glass-heavy` to true glassmorphism (`backdrop-filter: blur(16–18px)` + translucent brand tint).
- Replace gold flourishes (`gold-line`, `shimmer-text`, `btn-glow`) with restrained brand-appropriate motion.
- **Exit check:** brand-fidelity audit passes — no black/gray/gold anywhere; light+dark both clean; no FOUC.

### Phase 2 — EV tiers + fixed fare (1–2 days)
- Prisma: add `tier String` to `Ride`; migrate.
- Add `GET /api/fleet/tiers` (serve the five tiers from `api/seed.py` data).
- Rider UI: tier selector (reuse the landing page's five-tier design language).
- Make `/rides/estimate` tier-aware; rider booking uses the returned fixed fare (kill the `35.00` hardcode).

### Phase 3 — Airport & flight intelligence (2 days)
- Prisma: add `airportCode`, `terminal`, `flightNo` to `Ride`; migrate.
- Wire existing `api/flights` (AviationStack) into the booking flow; show live status.
- Flight-aware pickup surcharge in the fare; show flight + terminal on the driver's assignment card.
- **PostGIS payoff:** add a `geography(Point)` column to `User`/`Ride` and replace the current "poll all pending" matching with a real **nearest-available-driver** query (`ST_DWithin`/`ST_Distance`) filtered by tier — the matching upgrade the SQLite version couldn't do.

### Phase 4 — Polish & completion (1 day)
- Receipt object on `COMPLETED`; elegant end-of-trip summary (both views).
- Skeleton loaders (replace spinners); honor `prefers-reduced-motion`.
- Lighthouse ≥ 90; verify against PRD §8 success metrics.

### Phase 5 (optional) — Fast-follows
- Keep the Finnhub ticker as an "executive" flourish (or cut for focus).
- WebSocket status stream to replace polling; live GPS trail.

---

## 5. Decisions

**Resolved:**
- ✅ **Database:** move to **Postgres + PostGIS now** (not SQLite). Folded into Phase 0; unlocks nearest-driver matching in Phase 3.
- ✅ **Execution:** **lock the plan first — no code yet.** Await sign-off before Phase 0.

**Still open (your call before we start building):**
1. **Copy-in vs. fork-in-place** — adapt the OSS app inside `Documents\Ezyride` (recommend `/app`), or keep working in the `Downloads` copy?
2. **Postgres host** — local Docker Postgres for dev, or **Supabase** straight away (managed, PostGIS-ready, matches PRD hosting)?
3. **Ticker** — keep the Finnhub market ticker as a luxury touch, or remove as off-brief?

---

*Companion docs: `PRD.md` (product spec), `api/openapi.yaml` (API contract), `api/seed.py` (tier/airport/fare seed data — reuse its numbers).*
