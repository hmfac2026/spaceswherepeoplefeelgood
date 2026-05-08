# Spaces Where People Feel Good — Build Spec

## Overview

A community-curated map of places that feel good. People submit spaces where they've felt something — a park, a cafe, a quiet church, a particular hotel — and answer three questions about why. Other people can second a place ("I feel it too") to surface places where multiple people have felt the same thing. The product lives at **spaceswherepeoplefeelgood.com**.

The audience is people who care about the felt sense of a place. The aesthetic should feel like a thoughtful journal or zine — warm, calm, lightly designed — not a startup dashboard. The map is the centerpiece.

## Tech stack

- **Framework:** Next.js (latest stable, App Router) with TypeScript
- **Hosting:** Vercel
- **Database:** Vercel Postgres (Neon under the hood)
- **ORM:** Drizzle
- **Auth:** Clerk (Google OAuth + email magic link)
- **Map rendering:** Mapbox GL JS
- **Place search & data:** Google Places API (server-side)
- **Email:** Resend
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui (sparingly — most components custom)

## Domain & deployment

- Production: `spaceswherepeoplefeelgood.com`
- Preview deployments via Vercel for every PR
- Environment variables set in Vercel dashboard (see below)

## Data model

All tables use UUID primary keys. Timestamps are `timestamp with time zone`.

### `users`

Mirrors Clerk for app-side joins. Webhook-synced on signup.

| column | type | notes |
|---|---|---|
| id | uuid | pk |
| clerk_user_id | text | unique, not null |
| email | text | not null |
| display_name | text | nullable until first set |
| is_admin | boolean | default false |
| created_at | timestamptz | default now() |

### `places`

One row per real-world location, keyed off Google Place ID to prevent duplicates.

| column | type | notes |
|---|---|---|
| id | uuid | pk |
| google_place_id | text | unique, not null |
| name | text | not null |
| category | enum | see categories below |
| lat | numeric(10, 7) | not null |
| lng | numeric(10, 7) | not null |
| address | text | nullable |
| photo_url | text | nullable, from Google Places |
| status | enum | `pending` \| `live` \| `rejected`, default `pending` |
| submitted_by | uuid | fk → users.id |
| created_at | timestamptz | default now() |
| approved_at | timestamptz | nullable |

### `entries`

Multiple people can contribute to the same place. Each contribution is an entry.

| column | type | notes |
|---|---|---|
| id | uuid | pk |
| place_id | uuid | fk → places.id |
| user_id | uuid | fk → users.id |
| special_to_you | text | not null |
| energy | text | not null |
| what_to_do | text | not null |
| status | enum | `pending` \| `live` \| `rejected`, default `pending` |
| created_at | timestamptz | default now() |
| approved_at | timestamptz | nullable |

### `affirmations`

| column | type | notes |
|---|---|---|
| id | uuid | pk |
| place_id | uuid | fk → places.id |
| user_id | uuid | fk → users.id, nullable |
| anon_cookie_id | text | nullable |
| created_at | timestamptz | default now() |

Constraints:
- Unique on `(place_id, user_id)` where user_id is not null
- Unique on `(place_id, anon_cookie_id)` where anon_cookie_id is not null
- Check: exactly one of `user_id` or `anon_cookie_id` is set

### Category enum

```
park_nature
spiritual_site
cafe
restaurant
bar
hotel_stay
wellness_studio
bookstore
museum_gallery
other
```

Each category has a display label and a Mapbox marker color (define in a single `categories.ts` config file so they can be tuned in one place).

## Auth model

Clerk handles all identity. Two sign-in methods:
1. Continue with Google (OAuth)
2. Continue with email (magic link, no password)

Sync Clerk users to local `users` table via webhook on `user.created`. Use Clerk middleware to protect routes.

**Auth boundaries:**
- Public: homepage, map, place detail pages
- Auth required: `/add`, `/me`, affirming as a user
- Admin only: `/admin/*`

Anonymous users can affirm via cookie (one per browser per place). When they later sign up, don't migrate anon affirmations — too messy, not worth it for v1.

## Routes / pages

### Public

**`/` — Homepage**
- Hero section: full viewport height, centered tagline "Building a map of places with good energy — and a community of people who find them"
- Subtle scroll indicator
- Below: full-bleed map, ~90vh, with all `live` place pins
- Floating "Add a place" button (bottom-right on desktop, full-width sticky on mobile)
- Header: minimal, logo/wordmark left, sign-in or profile menu right

**`/place/[id]` — Place detail**
- Can be implemented as a modal overlay on the map OR a dedicated route — prefer dedicated route so URLs are shareable, with an option to render in modal context when arrived at via map click
- Place name, category badge, address
- Hero photo from Google
- Affirmation count + "I feel it too" button
- Stacked list of entries (one per contributor):
  - Display name
  - Their three answers, each labeled with the question
  - Date contributed
- "Add your own perspective" link (if user is signed in and hasn't already contributed to this place)

### Auth required

**`/add` — Submission flow**

Single-page, multi-step form (no page navigation between steps; just transitions):

1. Search a place: Google Places autocomplete input. Restrict to `establishment` and `geocode` types.
2. Confirm: show selected place with photo and address. "Is this right?" with back option.
3. Category: chip-style picker, all 10 categories, single select. Pre-select based on Google's place type if possible.
4. Three questions, one per screen or stacked:
   - "What makes this place special to you?"
   - "What gives this place its energy?"
   - "What's one thing a visitor should do or experience here?"
   - Each is a textarea, soft min ~30 chars, max ~500
5. Review + submit
6. Success screen: "Thanks. We'll review and let you know when it's live. You'll usually hear back within a day."

If a place with this `google_place_id` already exists:
- If `live`: skip the place creation, just create an entry. Tell user "This place is already on the map — you're adding your perspective."
- If `pending`: tell user "This place is being reviewed. You can add your perspective and it'll be reviewed alongside it." Create entry with status=pending.

**`/me` — Your contributions**
- List of places the user has submitted or contributed entries to
- Each shows: place name, status (Pending / Live / Not approved), date
- Click through to place page if live
- Section at top: editable display name

### Admin

**`/admin` — Moderation queue**
- Server-side check: user.is_admin must be true, else 404
- Two tabs: Pending Places, Pending Entries
- Each card shows full submission, submitter info (name + email + history count), and Approve / Reject buttons
- Approve sets status=live, approved_at=now, triggers email
- Reject sets status=rejected (don't delete; useful for analysis)

**`/admin/places` — All places management**
- Table view: search, filter by status, edit category, edit photo, delete (soft delete by setting status=rejected for now)

## API routes

All under `/api/`. Use Next.js Route Handlers.

```
POST   /api/places                    submit new place + first entry
GET    /api/places                    list live places (for map; returns minimal payload: id, name, category, lat, lng)
GET    /api/places/[id]               full place detail with all live entries
POST   /api/places/[id]/entries       add entry to existing place
POST   /api/places/[id]/affirm        toggle affirmation (idempotent per user/cookie)
DELETE /api/places/[id]/affirm        remove affirmation
POST   /api/admin/places/[id]/approve admin only
POST   /api/admin/places/[id]/reject  admin only
POST   /api/admin/entries/[id]/approve admin only
POST   /api/admin/entries/[id]/reject  admin only
POST   /api/webhooks/clerk            Clerk user.created webhook
```

## Third-party integrations

**Google Places API**
- Used server-side only. The API key never touches the client.
- Autocomplete: client sends partial text → server proxies to Places Autocomplete → returns predictions
- Place details: on selection, server fetches details by place_id and returns the fields needed (name, address, lat/lng, photos, types)
- Photos: store the photo URL (or re-host to Vercel Blob later if rate limits become an issue — out of scope for v1)

**Mapbox**
- Use Mapbox GL JS in the browser
- Custom style URL — start with a clean light style, customize later. Reference: `mapbox://styles/mapbox/light-v11` as a placeholder; create a custom style in Mapbox Studio matching the warm/earthy palette before launch.
- Markers: small circular dots colored by category, slight pulse animation when first rendered
- Disable rotation, keep pitch flat, sane min/max zoom
- Cluster pins when zoomed out (Mapbox built-in clustering)

**Clerk**
- Drop-in `<SignIn />` and `<SignUp />` components on dedicated pages, or modal mode triggered from header
- Configure Google OAuth and email magic link only (disable other methods)
- Branding: match the site's palette via Clerk's appearance config

**Resend**
- Three transactional templates (see Email below)

## Environment variables

```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_MAPBOX_TOKEN=
GOOGLE_MAPS_API_KEY=
RESEND_API_KEY=
ADMIN_EMAIL=
NEXT_PUBLIC_APP_URL=https://spaceswherepeoplefeelgood.com
```

## Email

Three templates, sent via Resend.

1. **Welcome** — sent on first sign-in. Light, one paragraph, sets the tone of the project. CTA: add your first place.
2. **Your place is live** — sent when a submission is approved. Includes link to the place page.
3. **New submission alert** — sent to `ADMIN_EMAIL` when anything enters the moderation queue. Plain, just the gist + link to /admin.

Templates should be HTML with a plain-text fallback. Keep them visually quiet — same warm tone as the site, no marketing-email loudness.

## Design direction

The single most important design decision: **this should not look like a SaaS app.** No dark navy. No gradient buttons. No AI-generated hero illustration.

- **Palette:** warm off-white background, deep ink for text, one accent (a muted terracotta or sage works well — pick one and commit). Map markers use a small range of warm colors keyed to category.
- **Typography:** a serif for headlines (Fraunces, EB Garamond, or similar), a clean humanist sans for body (Inter is fine, but Söhne or similar feels more crafted). Generous line-height.
- **Layout:** lots of whitespace, never feel crowded. Single-column mobile, never wider than ~720px for text content.
- **Motion:** subtle. Soft fade-ins on scroll, gentle marker pulse, smooth transitions between submission steps. No bounces, no springs.
- **Voice in copy:** sincere, plainspoken, slightly poetic. Never marketing-speak. Examples:
  - Loading state: "Finding spaces…" not "Loading places"
  - Empty state on /me: "You haven't added a place yet. When something feels right, come back and tell us about it."
  - Submission success: "Thanks. We'll take a look soon."

When in doubt, look at sites like Are.na, Cabin, or Pioneer Works for tonal reference — not at typical Vercel template sites.

## Build order

Each phase is an isolated, deployable unit. Don't move on until acceptance criteria pass.

### Phase 1 — Foundation

- Initialize Next.js with TypeScript, Tailwind, App Router
- Set up Drizzle + Vercel Postgres, write schema, run initial migration
- Install and configure Clerk (Google + email magic link only)
- Set up Clerk webhook for `user.created` → upsert into `users` table
- Deploy to Vercel and connect domain
- Build minimal homepage with tagline only (no map yet)

**Acceptance:** site is live at the domain, signup with Google and email magic link both work, a new user appears in the `users` table.

### Phase 2 — Map + place display

- Mapbox integration on homepage (default style for now)
- Seed script: insert 5 hand-picked example places with status=live
- Fetch live places via `/api/places` and render as markers, colored by category
- Click marker → navigate to `/place/[id]` (or open as a modal that updates URL)
- Place detail page renders place info + any entries

**Acceptance:** seeded places appear on the map, clicking a pin shows full detail.

### Phase 3 — Submission flow

- `/add` page, auth-protected (redirect to Clerk sign-in if not logged in)
- Google Places autocomplete (server-proxied)
- Category picker
- Three-question form
- Submit → POST `/api/places` → creates place (or entry on existing place) with status=pending
- Confirmation screen

**Acceptance:** logged-in user can complete the full submission flow; submission appears in DB as pending; if user submits a duplicate google_place_id, it routes to entry-creation instead.

### Phase 4 — User surfaces

- Header profile menu (avatar + dropdown: Your places, Sign out)
- `/me` page listing user's submissions and entries with statuses
- Display name field, editable on `/me`, prompted on first signup if empty

**Acceptance:** user can see all their contributions; can set/edit display name.

### Phase 5 — Affirmations

- "I feel it too" button on place detail
- POST/DELETE `/api/places/[id]/affirm`
- Logged-in users use user_id; anon users use a cookie (`anon_id`, set if missing)
- Show count next to button; button reflects affirmed/not state
- Idempotent (clicking twice doesn't duplicate)

**Acceptance:** any visitor can affirm once per place, count updates immediately, no duplicates.

### Phase 6 — Admin moderation

- Add `is_admin` flag (manually set in DB for first admin)
- `/admin` queue with Pending Places and Pending Entries tabs
- Approve/reject actions wired to API
- On approve: status=live, approved_at=now, send "your place is live" email
- On any new submission: send admin notification email

**Acceptance:** admin can see queue, approve and reject submissions, emails fire correctly.

### Phase 7 — Polish

- Custom Mapbox style matching the palette
- Marker clustering at low zoom
- Mobile audit: every screen tested at 375px and 414px widths
- Loading states, empty states, error states everywhere
- Copy pass: every piece of copy reviewed against the voice guidelines
- Lighthouse pass: aim for 95+ performance, 100 accessibility on homepage
- Custom 404 and error pages
- Open Graph image and meta tags for shareability

**Acceptance:** the site feels finished — there are no jarring transitions, no unstyled states, no SaaS-default looking screens.

## Out of scope for v1

Explicitly not building:
- User photo uploads (use Google's photos)
- Comments or threading on entries
- Following other users
- Direct messages
- Mobile app
- Search and filtering UI on the map (add in v1.1 once there's enough data to need it)
- Notification preferences
- Public user profile pages
- Migrating anonymous affirmations on signup

## Edge cases & gotchas

- **Duplicate place submission:** always check `google_place_id` first. Never create two place rows for the same real place.
- **Pending place, second submitter:** their entry attaches to the pending place; both get reviewed together.
- **Rejected entries:** show on `/me` as "Not approved" without explanation; don't expose admin reasoning to users.
- **Affirmation race conditions:** use DB-level unique constraints, not application logic, to prevent doubles.
- **Google Places photo URLs expire:** they're tied to a session; for now, fetch fresh on place detail load. If this becomes a bottleneck, re-host to Vercel Blob (deferred).
- **Mapbox token security:** the public token is fine to expose, but lock it to your domain in the Mapbox dashboard.
- **Display name uniqueness:** don't enforce; "Sarah" is fine to repeat. If two Sarahs both contribute to a place, it's not confusing in context.
- **Admin bootstrap:** the first admin is set by hand in the DB. Don't build admin invitation flow yet.

## Repo conventions

- File structure: standard Next.js App Router (`app/`, `components/`, `lib/`, `db/`, `emails/`)
- All shared types in `lib/types.ts` or co-located with their feature
- Server actions preferred over API routes where possible (for form submissions)
- Use Drizzle's prepared queries for the hot paths (homepage map fetch)
- Tailwind classes only — no CSS modules, no styled-components
- Format with Prettier, lint with ESLint, both run on commit via simple husky setup

## Definition of done for v1 launch

- All seven phases complete and deployed
- Domain live with SSL
- 10+ real places seeded (your own contributions to start)
- Both auth methods tested end-to-end
- Mobile and desktop both feel finished
- One trusted reviewer besides yourself has admin access and has approved a submission
- Open Graph preview tested in Twitter, iMessage, and Slack
