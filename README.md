# Awan Rental Service

A production-ready, full-stack car rental and ground transportation website for Awan Rental Service, serving Pakistan (Islamabad, Rawalpindi, Lahore, and nationwide).

- **Live site**: https://awanrentalservice.org/
- **Repository**: `xneshaniy/AWAN-RENTAL-SEVRIVES`

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router, Server Components + Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth.js — Credentials + optional Google OAuth |
| Forms | React Hook Form + Zod |
| Email | Nodemailer (SMTP) |
| Icons | Lucide React |
| Data fetching | TanStack Query |
| Notifications | React Hot Toast |

There is **no `vercel.json`** and no framework-specific config beyond `next.config.js`, so the app runs unchanged on Vercel, a Hostinger Node.js app, or any plain `npm run build && npm run start` host.

---

## Features

### Public website

- **Home** — hero with booking widget, trust section, featured vehicles, how it works, visitor section
- **Vehicle listing** — search, category / transmission / seats / price filters, sorting, pagination
- **Vehicle detail** — gallery with category grouping, specifications, pricing, availability, booking CTA, WhatsApp enquiry
- **Service pages** — Self Drive, Chauffeur, Airport Transfers, Corporate Travel
- **Booking flow** — validated form with server-side availability enforcement, WhatsApp hand-off, email notifications
- **Contact** — honeypot spam protection, server-side rate limiting
- **Blog** — published posts with slugs and metadata
- **`/faq`** — FAQ page, published as `FAQPage` JSON-LD
- **`/rental-terms`** — rental terms page, linked from the footer legal group
- **SEO** — per-page metadata, canonical URLs, Open Graph / Twitter cards, JSON-LD (`LocalBusiness`), `sitemap.xml`, `robots.txt`

> `src/lib/seo.ts` deliberately never emits `aggregateRating` / `review` JSON-LD. The homepage shows a Google reviews **link** only, and a rating appears only when Google itself returned one through the Places API.

### Admin dashboard (`/admin`)

Requires an `ADMIN` or `STAFF` session. Twelve sections:

Dashboard · Bookings · Vehicles · **Gallery** · Services · **FAQ** · Blog · Customers · Messages · Site Settings · SEO Settings · Admin Users

- **Vehicles** — full CRUD, archive/restore, feature toggles, per-vehicle gallery categories, security deposit
- **Gallery** — `/admin/gallery`, every photo and clip across the live fleet with the vehicle it belongs to. Photos live in `Vehicle.images` (there is no photo table), so this is a read-only overview; media is added on the vehicle edit screen.
- **Photo upload** — signed Cloudinary upload from the vehicle form (JPEG/PNG/WebP/AVIF/GIF, 8 MB); the button appears only when the three `CLOUDINARY_*` variables are set, otherwise URL pasting remains the path
- **Bookings** — list, filter, status workflow transitions
- **FAQ** — create / edit / hide / delete questions (`src/components/admin/FaqManager.tsx`); edits go live on `/faq` and `/self-drive` immediately
- **Settings** — business info, WhatsApp, social links, SEO, booking config
- **Live notifications** — see [Admin notifications](#admin-notifications-real-time)

### Admin notifications (real-time)

Server-Sent Events, not polling. One `EventSource` is opened per admin tab by
`NotificationProvider` and shared by the header bell and the dashboard
counters.

- **Database is the source of truth.** The stream is a low-latency wake-up
  call that also carries the new row. On every connect and reconnect the client
  re-reads `/api/notifications`, so a tab that was offline still catches up and
  a reconnect can never invent a duplicate.
- **Network loss is reported honestly.** An idle SSE socket stays structurally
  "established" after the machine goes offline — there is nothing left to
  write, so nothing ever fails — which would leave the header claiming *Live*
  while every new event silently went nowhere. The provider listens for the
  browser's own `offline` / `online` events: `offline` flips the indicator to
  *Reconnecting* straight away, and `online` reopens the stream and re-reads
  the database immediately rather than waiting out EventSource's retry timer.
  This is event-driven, not a poll; no timer is added.
- **Events** — `NEW_BOOKING`, `BOOKING_STATUS_CHANGED`, `NEW_CONTACT_MESSAGE`.
- **Read state** is per user (`NotificationRead`, composite key
  `notificationId + userId`); no row means unread, so it survives a refresh and
  never leaks between an ADMIN and a STAFF account.
- **Authorization is server-side.** `/api/notifications` and
  `/api/notifications/stream` return `401` to anyone without an `ADMIN` or
  `STAFF` session, and the stream closes when the session ends.
- **Migrations** — `prisma/migrations/20261008120000_add_notifications` and
  `20261008130000_add_notification_fks` must be applied with
  `npx prisma migrate deploy`.

> **WhatsApp is click-to-chat only.** There is no server-side WhatsApp sending:
> the app builds `https://wa.me/<number>?text=...` links (booking reference and
> details in the message) and the visitor presses send. No WhatsApp Business
> API, no paid gateway, no background delivery — never describe it as
> automatic.

### Email delivery

`sendEmail()` never throws. When `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD`
are absent it logs `Email not configured (SMTP missing)` and returns `false`;
a send failure is logged and also returns `false`. Data is always persisted
first, so email being unavailable can never fail a booking, a contact message
or a booking status change.

---

## Search & AI visibility (AEO)

The goal: someone asks ChatGPT, Gemini, Claude or Perplexity for a car rental
in Islamabad and this site is one of the answers they get. What the code
actually contributes to that:

| Signal | Where | What it does |
| --- | --- | --- |
| `robots.txt` | `src/app/robots.ts` | Allows the public site and **names every AI crawler explicitly** — GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Applebot-Extended, Bytespider, meta-externalagent, Amazonbot, cohere-ai, YouBot — so the invitation is auditable instead of implied by a wildcard. |
| `llms.txt` | `public/llms.txt` | Plain text written for models: what the business is, what each section answers, and which URL to read. Served at `/llms.txt`. |
| `sitemap.xml` | `src/app/sitemap.ts` | Rendered per request, so a newly published blog post or vehicle page is listed immediately. |
| JSON-LD | `src/lib/seo.ts`, `src/app/layout.tsx` | Site-wide `Organization` + `WebSite` + `LocalBusiness`/`AutoRental` with `telephone`, `address`, `areaServed` and `sameAs`. Per page: `Service`, `FAQPage`, `BreadcrumbList`, `Article`. |
| Canonicals | each `page.tsx` | One URL per page, so engines consolidate signals instead of splitting them across variants. |
| IndexNow | `scripts/submit-indexnow.mjs` | Pushes every sitemap URL to Bing, Yandex, Ecosia, Seznam and Naver on demand — free, no account. |

### robots.txt group semantics (what the tests guard)

A crawler uses **only** the most specific `User-agent` group that names it;
groups are never merged. A named AI group carrying `Allow: /` but no
`Disallow` would therefore out-permission the `*` group and hand GPTBot and
friends `/admin/` and `/api/`. Every group repeats the same block list, and
`tests/robots.test.ts` pins that in six assertions.

### Submitting to the indexes

```bash
npm run indexnow                # submit the production sitemap
npm run indexnow -- --dry-run   # list the URLs, send nothing
```

The key is `public/<uuid>.txt`, published on purpose; the payload is public
sitemap URLs only. Nothing secret is sent and nothing is paid for.

### What code cannot do

Markup gets a site *read*; it does not get it *cited*. That part is external:

1. **Google Search Console** — verified for this domain. Submit the sitemap,
   then use **Request Indexing** on `/`, `/vehicles`, `/services`, `/faq`.
2. **Bing Webmaster Tools** — verified for this domain. Submit the sitemap
   there too; IndexNow and the console are separate submissions.
3. **Content worth quoting** — every FAQ entry, service page and blog post is
   a discrete passage an engine can lift. Fresh, specific, first-hand text is
   the dominant factor in whether an assistant cites you; markup is not.
4. **Third-party corroboration** — directories, maps and the profiles listed
   in `sameAs` are how engines decide a business is real rather than a
   template site.

---

## Getting started

```bash
# Install (also runs `prisma generate` via postinstall)
npm install

# Configure
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
# then edit .env with real values

# Apply migrations, then seed
npm run db:migrate
npm run db:seed

# Dev server
npm run dev
```

### Prerequisites

- Node.js 18+ (22 recommended)
- PostgreSQL 14+

---

## Environment variables

Copy `.env.example` — it is the authoritative list. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical URLs, sitemap, `robots.txt`, OG — must match the real domain |
| `NEXTAUTH_SECRET` | ✅ | JWT signing key |
| `NEXTAUTH_URL` | ✅ | Exact origin of the deployment |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ | `wa.me` deep links |
| `ADMIN_EMAIL` | ✅ | Admin notification recipient |
| `SMTP_HOST` / `SMTP_PORT` | 🟡 | Without these **no mail is sent at all** |
| `SMTP_USER` / `SMTP_PASSWORD` | 🟡 | Mailbox credentials — required for `isEmailConfigured()` to pass |
| `GOOGLE_PLACES_API_KEY` | ⬜ | Live Google reviews (server-only) |
| `GOOGLE_PLACE_ID` | ⬜ | Required alongside the key; otherwise reviews render as a link |
| `NEXT_PUBLIC_GA_ID` | ⬜ | Google Analytics 4 — component renders nothing when unset |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | ⬜ | Google Search Console meta tag |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ⬜ | Google sign-in (only if both are set) |
| `STRIPE_*` (3) | ⬜ | Reserved — no Stripe code exists yet |
| `CLOUDINARY_*` (3) | ⬜ | Reserved — no upload code exists yet |

**Never commit `.env`.** Never paste secrets into chat or issues.

> Email status: `isEmailConfigured()` in `src/lib/email.ts` requires `SMTP_HOST` **and** `SMTP_USER` **and** `SMTP_PASSWORD`. If any is missing the contact/booking routes still succeed (they use `Promise.allSettled`) but **no email leaves the server**.

---

## Database

### Migrations

`prisma/migrations/` **is committed to git** (it is the only reproducible description of the production schema — `.gitignore` deliberately does not exclude it).

```bash
npm run db:migrate      # development — creates + applies
npx prisma migrate deploy   # production / CI — applies pending only
npx prisma generate     # regenerate the typed client after a schema change
```

`prisma db push` is **banned** in this project: it skips the migration history and drifts from production.

### Models

19 models, 14 enums — including `User`, `Vehicle`, `Booking`, `Payment`, `Review`, `Inquiry`, `ContactMessage`, `Setting`, `SiteContent`, `BlogPost`, `FAQ`, `Testimonial`, `Location`, `Promotion`, `Availability`, `RateLimit`.

### Booking overlap protection (two layers)

1. **Application level** — `src/lib/availability.ts` decides overlap with inclusive ranges, then `src/lib/booking.ts` re-checks inside a transaction with `SELECT … FOR UPDATE`.
2. **Database level** — `bookings_no_overlap`, a `btree_gist` exclusion constraint covering the always-blocking statuses (`CONFIRMED`, `ACTIVE`, `COMPLETED`, `NO_SHOW`). `PENDING` is intentionally excluded because it only holds dates while the configurable hold window is live, and `CANCELLED` frees the vehicle.

---

## Testing

```bash
npm run test:whatsapp         # WhatsApp message builders
npm run test:google-reviews   # reviews fallback + link-only mode
npm run test:availability     # pure date-overlap logic
npm run test:cloudinary       # upload signing + file validation (no network)
npm run test:availability:db  # ⚠️ writes fixture rows, then deletes them
npm run test:notifications    # notification store: dedup, per-user read, cascade
npm run test:email            # booking email templates (request vs confirmed)
npm run test:gallery          # /gallery is not prerendered + admin gallery view
npm run test:robots           # robots.txt policy: every AI group repeats the block list
npm run test                  # all of the above, in order
```

> ⚠️ `test:availability:db` performs real inserts and deletes against `DATABASE_URL`. Point it at a development database, never production.

### Browser E2E (Playwright)

```bash
npm run build                 # the suite runs the standalone production output
npm run test:e2e              # real Chrome, 38 tests
```

`playwright.config.ts` starts `.next/standalone/server.js` on port 3000 with
`.env.e2e` — a git-ignored copy of `.env` in which every `SMTP_*` **value is
blanked rather than the key deleted**. That distinction matters: the standalone
server re-loads `.env` at runtime, so merely removing the keys let dotenv
silently re-inject them, and one early run did reach the real SMTP server and
was turned away with `554 5.7.1 Recipient domain is reserved for
documentation (RFC 2606)` — nothing was delivered, but it proved the gap.
dotenv never overwrites a key that already exists, so an empty value is what
actually guarantees a run transmits nothing; the server logs
`Email not configured (SMTP missing)` instead. Port 3000 is not arbitrary:
`NEXTAUTH_URL` in that file is `http://localhost:3000`, and next-auth validates
the origin on the callback.

Four spec files:

| File | Covers |
| --- | --- |
| `tests/e2e/notifications.spec.ts` | Tests 1–10 (login, bell, badge, open/close, Escape, focus return, mark-read persistence, two-browser isolation, unauthorized APIs), plus live badge/counter updates, click-through, status change, contact form, offline→reconnect recovery, mark-all and the `wa.me` link |
| `tests/e2e/a11y.spec.ts` | Tab reachability, `aria-label` / `aria-expanded`, visible focus ring, Enter/Space/Escape, accessible names inside the panel, axe-core WCAG A/AA scan with the dropdown open |
| `tests/e2e/responsive.spec.ts` | The bell and dropdown at 375×812, 390×844, 412×915, 768, 1024, 1280 and 1440 |
| `tests/e2e/gallery.spec.ts` | The whole media flow: upload from the vehicle form → Cloudinary → database → `/admin/gallery` → public `/gallery` → hard reload, plus anonymous 401s on the upload endpoint |

Global setup creates a throw-away `STAFF` and `CUSTOMER` account and a
`.data.json` marker; global teardown deletes them plus every booking, message,
notification and `E2E Gallery Probe*` vehicle the run created. None of the four
ever touches the eight production vehicle records.

### Quality gate

After **any** code change, run all four before committing:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm test
```

---

## Deployment

Production: **https://awanrentalservice.org/**

### Actual production platform — Hostinger, standalone Node.js

The original brief names Vercel, but **production is not on Vercel**. That is
verified from the repository configuration and the hosting control panel, not
assumed. Read this table before changing anything about how the app ships.

| | |
| --- | --- |
| Expected platform (brief) | Vercel |
| **Actual platform** | **Hostinger Node.js app**, running the Next.js standalone bundle |
| How the app is deployed | `npm ci` → `npm run build` → the process is started from `.next/standalone/server.js` |
| Why standalone | `next.config.js` sets `output: 'standalone'`, and `postbuild` (`scripts/copy-standalone.mjs`) copies `public/` and `.next/static/` into `.next/standalone/`. There is no `vercel.json`. |
| Where environment variables live | Hostinger control panel → Node.js app → *Environment variables*. **15** are configured in production. Saving that list **replaces** it — any key omitted from the payload is deleted. |
| How Prisma migration is executed | `npx prisma migrate deploy` run locally against the production `DATABASE_URL`. Never `prisma db push`, never `prisma migrate reset`. |
| Safe restart | `POST /nodejs/server/restart` — reloads the process without touching the database. `POST /nodejs/builds` is **not** the deploy path and is destructive. |
| Node | 22 |

Pushing to `main` does **not** deploy anything by itself. The Hostinger build
must be triggered explicitly, and the migration must be applied separately
before the new code runs.

### Vercel (alternative / rollback only)

1. Push to GitHub
2. Import the repo
3. Add the **required** environment variables above (mark `DATABASE_URL` sensitive)
4. Deploy

Vercel remains available as a rollback target. It is not the current
production platform, and no part of the deployment procedure depends on it.

### Production database schema

`prisma/migrations/` is committed and is the only reproducible description of
the production schema. Applying it to production is always:

```bash
npx prisma migrate deploy
```

`prisma db push` is banned in this project: it skips the migration history and
drifts from production.

---

## Project structure

```
src/
├── app/                  # App Router pages and API routes
│   ├── api/              # REST handlers (bookings, contact, vehicles, auth, admin)
│   ├── admin/            # Login + dashboard (12 sections)
│   ├── vehicles/         # Listing and [slug] detail
│   ├── blog/             # Index and [slug] posts
│   ├── faq/              # Public FAQ page
│   ├── rental-terms/     # Rental terms page
│   └── ...
├── components/
│   ├── ui/               # Button, Input, Card, Badge, ...
│   ├── layout/           # Header, Footer
│   ├── admin/            # AdminShell, FaqManager, VehicleForm, ...
│   ├── vehicles/         # VehicleCard, gallery
│   ├── booking/          # BookingForm
│   └── common/           # GoogleAnalytics, ...
├── lib/                  # prisma, auth, email, seo, availability, rate-limit, ...
├── actions/              # Server actions
├── config/               # site.ts — SITE_URL, nav, legal links
└── types/                # Shared types (incl. ADMIN_NAV, DTOs)
prisma/
├── schema.prisma         # 19 models
└── migrations/           # committed — apply with `prisma migrate deploy`
tests/                    # node:test suites
```

---

## Customization

- **Branding** — colours in `tailwind.config.ts`, logo in `Header.tsx`
- **Business info / socials / SEO** — Admin → *Site Settings* and *SEO Settings* (stored in `Setting`, not hardcoded)
- **Vehicle categories** — edit the `VehicleCategory` enum, then create a migration
- **Email templates** — `src/lib/email.ts`
- **WhatsApp messages** — `src/lib/whatsapp.ts`
- **FAQ copy** — Admin → *FAQ*

---

## Security

- Server-side Zod validation on every mutation
- bcryptjs password hashing
- CSRF protection and secure cookies via NextAuth
- Role-based access control (`ADMIN` / `STAFF`) enforced in `requireStaffAccess` / `requireAdminAccess`
- Honeypot spam protection on the contact form
- Rate limiting on login, booking, contact and enquiry
  - `src/lib/rate-limit.ts` — in-process, also the only gate available on the edge runtime (`middleware.ts`)
  - `src/lib/rate-limit-db.ts` — durable, cross-instance counter in the `rate_limits` table; **fails open** so a limiter fault never blocks a real customer
- `src/lib/seo.ts` never fabricates ratings or review counts

---

## Accessibility

Semantic HTML, ARIA labels and roles, keyboard navigation, focus management, WCAG contrast, alt text on every image.

---

## Known gaps

Tracked openly so nothing is mistaken for finished work:

- The canonical domain currently serves a Hostinger placeholder until the app is deployed there (all canonicals, the sitemap and `og:image` already point at `https://awanrentalservice.org`).
- Stripe payment code and Cloudinary image upload are **not implemented** — only their environment variables exist.
- No admin UI for editing the root JSON-LD graph beyond the SEO settings form.

---

## License

MIT — see [LICENSE](./LICENSE).

## Support

For issues or questions, open a GitHub issue.

---

**Built with ❤️ for Awan Rental Service**
