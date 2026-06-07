# Multi-Calendar Booking Platform

A self-hosted appointment scheduling platform (Calendly-style) built per the
[SRS](./SRS.md). Admins create unlimited booking calendars with independent
scheduling rules; the public books conflict-free slots; bookings sync to Google
Calendar.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL** + **Prisma 6** (service / repository / controller layering in `lib/`)
- **NextAuth v5** (credentials, JWT sessions) for admin auth
- **Google Calendar API** + OAuth 2.0 (busy-time sync + event creation)
- **Tailwind CSS v4** + **React Query**

## Features (MVP acceptance criteria)

- Admin login / logout (email + password)
- Unlimited calendars, each with own slug, duration, buffer, timezone, availability
- Weekly availability with **multiple time windows per day**
- Manual blocks: full-day or time-range
- **Availability engine**: working hours − blocks − Google busy − bookings, spaced by buffer
- Public booking flow: month calendar → slots → form → confirmation
- **Double-booking prevention**: re-validation before insert + DB unique constraint
- Booking management with filters (calendar, status, date, email, name)
- Google Calendar OAuth, encrypted token storage (AES-256-GCM), busy-time sync, event creation
- Mobile responsive

## Getting started

### 1. Prerequisites

- Node 20+
- A running PostgreSQL instance

### 2. Environment

Copy and adjust `.env` (already generated for local dev). Key vars:

```
DATABASE_URL=postgresql://USER@localhost:5432/calendar_app?schema=public
AUTH_SECRET=...                 # NextAuth secret
TOKEN_ENCRYPTION_KEY=...        # 64-char hex (32 bytes) for Google token encryption
GOOGLE_CLIENT_ID=              # optional — leave blank to run without Google
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin1234
```

> The platform runs fully without Google credentials — only cross-calendar busy
> sync and event creation stay disabled until you connect an account.

### 3. Install, migrate, seed

```bash
npm install
npx prisma db push      # or: npx prisma migrate dev
npm run db:seed         # creates admin + 2 sample calendars
```

### 4. Run

```bash
npm run dev
```

- Public site: http://localhost:3000
- Sample booking pages: `/book/free-consultation`, `/book/discovery-call`
- Admin: http://localhost:3000/login (`admin@example.com` / `admin1234`)

## Google Calendar setup (optional)

1. Create OAuth credentials in Google Cloud Console (Web application).
2. Add redirect URI `http://localhost:3000/api/google/callback`.
3. Enable the **Google Calendar API**.
4. Put the client id/secret in `.env`, restart, then **Admin → Google Calendar → Connect**.

## API overview

| Area        | Endpoint |
|-------------|----------|
| Calendars   | `GET/POST /api/calendars`, `GET/PUT/DELETE /api/calendars/:id` |
| Availability| `GET/PUT /api/calendars/:id/availability` |
| Blocks      | `GET/POST /api/calendars/:id/blocks`, `DELETE /api/calendars/:id/blocks/:blockId` |
| Public      | `GET /api/public/:slug`, `GET /api/public/:slug/slots?date=YYYY-MM-DD` |
| Bookings    | `POST /api/bookings` (public), `GET /api/bookings` (admin), `GET/PATCH /api/bookings/:id` |
| Google      | `GET /api/google/connect`, `GET /api/google/callback`, `POST /api/google/disconnect`, `GET /api/google/status` |

## Project structure

```
app/
  api/                 # route handlers (controllers)
  admin/               # protected dashboard (server layout + client pages)
  book/[slug]/         # public booking flow
lib/
  availability.ts      # pure availability engine
  time.ts              # timezone helpers (date-fns-tz)
  google.ts            # Google Calendar service (graceful fallback)
  crypto.ts            # AES-256-GCM token encryption
  services/            # availability + booking orchestration
  validators.ts        # zod schemas
prisma/
  schema.prisma        # data model
  seed.ts              # admin + sample data
```

## Scheduling correctness notes

- All slot math is timezone-aware: wall-clock windows are converted to absolute
  UTC instants per the calendar's IANA timezone before comparison.
- Past slots are never offered.
- Buffers pad both candidate spacing and busy intervals.
- A unique `(calendarId, startsAt)` constraint is the final guard against races.
