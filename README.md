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

Requires an `ADMIN` or `STAFF` session. Eleven sections:

Dashboard · Bookings · Vehicles · Services · **FAQ** · Blog · Customers · Messages · Site Settings · SEO Settings · Admin Users

- **Vehicles** — full CRUD, archive/restore, feature toggles, per-vehicle gallery categories, security deposit
- **Photo upload** — signed Cloudinary upload from the vehicle form (JPEG/PNG/WebP/AVIF/GIF, 8 MB); the button appears only when the three `CLOUDINARY_*` variables are set, otherwise URL pasting remains the path
- **Bookings** — list, filter, status workflow transitions
- **FAQ** — create / edit / hide / delete questions (`src/components/admin/FaqManager.tsx`); edits go live on `/faq` and `/self-drive` immediately
- **Settings** — business info, WhatsApp, social links, SEO, booking config

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
npm run test                  # all five
```

> ⚠️ `test:availability:db` performs real inserts and deletes against `DATABASE_URL`. Point it at a development database, never production.

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

Two supported paths — Vercel remains the rollback target for a Hostinger move.

### Vercel

1. Push to GitHub
2. Import the repo
3. Add the **required** environment variables above (mark `DATABASE_URL` sensitive)
4. Deploy

### Hostinger Node.js app

Build settings: framework `next` · Node `22` · build `npm run build` · output `.next` · install `npm ci` · entry *(empty)* · domain `awanrentalservice.org`.

Enter the same 19 environment variables as Vercel. The DNS for the domain already points at Hostinger.

### CI note

> ⚠️ Pushes to `main` trigger a **production** Vercel deployment. Always confirm with the project owner before pushing to `main`.

---

## Project structure

```
src/
├── app/                  # App Router pages and API routes
│   ├── api/              # REST handlers (bookings, contact, vehicles, auth, admin)
│   ├── admin/            # Login + dashboard (11 sections)
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
