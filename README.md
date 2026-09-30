# Awan Rental Service - Complete Car Rental Platform

A production-ready, full-stack car rental and ground transportation website for Awan Rental Service, serving Pakistan (Islamabad, Rawalpindi, Lahore, and nationwide).

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials + Google OAuth)
- **Forms**: React Hook Form + Zod validation
- **Email**: Nodemailer (SMTP)
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)
- **Notifications**: React Hot Toast

## ✨ Features

### Public Website
- **Homepage** - Hero with booking widget, trust section, featured vehicles, how it works, Pakistan visitor section
- **Vehicle Listing** - Filterable, paginated vehicle grid with categories
- **Vehicle Details** - Image gallery, specifications, pricing, booking CTA, WhatsApp inquiry
- **Service Pages** - Self-drive, Chauffeur, Airport Transfers, Corporate Travel
- **Booking System** - Complete form with validation, WhatsApp integration, email notifications
- **Contact Page** - Form with honeypot spam protection, office locations
- **About Page** - Company story, values, service coverage
- **SEO Optimized** - Meta tags, Open Graph, JSON-LD schema, sitemap, robots.txt

### Admin Dashboard
- **Authentication** - Secure login with role-based access (Admin/Manager)
- **Dashboard** - Statistics, recent bookings, quick actions
- **Vehicle Management** - CRUD operations, image management, availability toggles
- **Booking Management** - List, filter, status updates, customer contact
- **Settings** - Business info, WhatsApp, SEO, booking config
- **Messages** - Contact inquiries management

### Integrations
- **WhatsApp** - Dynamic message generation for bookings, inquiries, vehicle inquiries
- **Email** - Booking confirmations, admin notifications, contact form receipts
- **Database** - PostgreSQL with proper relations, indexes, constraints

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## 🛠 Installation

```bash
# Clone and navigate
cd awan-rental-service

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create `.env` file from `.env.example`:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/awan_rental?schema=public"

# Site URL (Required - used for canonical URLs, sitemap.xml, robots.txt, Open Graph)
NEXT_PUBLIC_SITE_URL="https://awanrentalservice.org"

# NextAuth (Required)
# Local dev: NEXTAUTH_URL="http://localhost:3000"
# Production: NEXTAUTH_URL="https://awanrentalservice.org"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# WhatsApp (Required for booking flow)
NEXT_PUBLIC_WHATSAPP_NUMBER="+923056846811"

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
ADMIN_EMAIL="info@awanrentalservice.org"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: Stripe Payments
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

Business contact details (phone, WhatsApp, email, address, hours, social links) are
stored in **SiteSettings** and can be edited in the admin panel under *Settings* —
they are not hardcoded in components. Verified defaults live in `src/config/site.ts`
and `prisma/seed.ts`.

## 🗄 Database Schema

Key models:
- **User** - Admins, managers, customers with roles
- **Vehicle** - Fleet with categories, pricing, availability
- **Booking** - Reservations with status workflow
- **Inquiry** - Contact messages
- **Setting** - Editable site configuration
- **Location** - Office/branch locations
- **Promotion** - Discount codes

## 🚀 Deployment

Production site: **https://awanrentalservice.org/** (Hostinger)

Set these environment variables in Hostinger's control panel before building:
`NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (a fresh random value),
`NEXT_PUBLIC_WHATSAPP_NUMBER`, `ADMIN_EMAIL`, `DATABASE_URL`, and optionally the
`SMTP_*` keys for email notifications.

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t awan-rental .
docker run -p 3000:3000 --env-file .env awan-rental
```

### VPS/Server
```bash
npm run build
npm run start
# Use PM2 or systemd for process management
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── vehicles/          # Vehicle pages
│   └── ...                # Public pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Header, Footer, Layout
│   ├── vehicles/          # Vehicle-specific components
│   ├── booking/           # Booking components
│   └── common/            # Shared components
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth config
│   ├── email.ts           # Email utilities
│   ├── whatsapp.ts        # WhatsApp utilities
│   ├── utils.ts           # Helper functions
│   ├── settings.ts        # Settings management
│   └── validations.ts     # Zod schemas
├── actions/               # Server actions
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

## 🎨 Customization

### Branding
- Update colors in `tailwind.config.ts`
- Replace logo in `Header.tsx`
- Modify company info in admin settings

### Vehicle Categories
Edit `VehicleCategory` enum in `prisma/schema.prisma` and run migration.

### Email Templates
Modify templates in `lib/email.ts`.

### WhatsApp Messages
Customize in `lib/whatsapp.ts`.

## 🔐 Security

- Server-side validation with Zod
- Password hashing with bcryptjs
- CSRF protection via NextAuth
- Rate limiting on forms
- Honeypot spam protection
- Secure cookies and sessions
- Role-based access control

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interfaces
- Optimized images with Next.js Image

## ♿ Accessibility

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Color contrast compliance
- Alt text for images

## 🧪 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
npm run db:migrate   # Run migrations
```

## 📝 License

MIT License - feel free to use for your own projects.

## 🤝 Support

For issues or questions, please open a GitHub issue or contact the development team.

---

**Built with ❤️ for Awan Rental Service**