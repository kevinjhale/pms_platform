# PMS Platform

A self-hostable property management system built with Next.js. Own your data, run it yourself.

## Features

- **Multi-tenant Architecture** - Support multiple organizations (property managers, landlords)
- **Property & Unit Management** - Full CRUD for properties and units
- **Listing Portal** - Public listings for renters to browse and apply
- **Application Workflow** - Submit, review, approve/reject applications
- **Lease Management** - Create leases, track terms, manage renewals
- **Rent Tracking** - Due dates, payment recording, late fee tracking
- **Maintenance Requests** - Tenant submissions with photo uploads, status tracking
- **Online Payments** - Stripe integration for rent collection
- **Email Notifications** - Automated emails for applications, maintenance, rent reminders
- **Background Jobs** - Scheduled tasks for payment reminders and lease alerts
- **Reporting Dashboard** - Occupancy, revenue, maintenance metrics
- **Mobile Responsive** - Full mobile support with collapsible navigation
- **Docker Ready** - Single container deployment

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (default) or PostgreSQL
- **ORM**: Drizzle
- **Auth**: NextAuth.js v5
- **Payments**: Stripe
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Testing**: Vitest + React Testing Library
- **Styling**: CSS (no framework)

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun 1.0+)
- Bun (recommended) or npm

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/kevinjhale/pms_platform.git
cd pms_platform

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your settings (see Configuration below)

# 4. Initialize the database
bun run db:push

# 5. Seed demo data (recommended for development)
bun run db:seed

# 6. Start development server
bun run dev
```

Visit `http://localhost:3000`

### Running the Full Stack

For a complete development environment with all features:

```bash
# Terminal 1: Start the web server
bun run dev

# Terminal 2: Start the background scheduler (optional - for automated emails)
npm run scheduler
```

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start

# Start background scheduler (separate process)
npm run scheduler
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

### Using Docker directly

```bash
# Build the image
docker build -t pms-platform .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v pms-data:/app/data \
  -e AUTH_SECRET="your-secret-here" \
  -e DATABASE_URL="file:./data/pms.db" \
  pms-platform
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# ============ REQUIRED ============

# Database (SQLite - default)
DATABASE_URL="file:./data/pms.db"

# Or PostgreSQL
# DATABASE_URL="postgresql://user:pass@localhost:5432/pms"

# Authentication secret (generate with: openssl rand -base64 32)
AUTH_SECRET="generate-a-random-string-here"

# Base URL (required for production)
NEXTAUTH_URL="https://your-domain.com"

# ============ OPTIONAL ============

# OAuth Providers
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Email Notifications (see docs/SMTP_SETUP.md)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@your-domain.com"
APP_NAME="PMS Platform"

# Stripe Payments (see docs/STRIPE_SETUP.md)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

### Configuration Guides

Detailed setup instructions for external services:

- **[SMTP Setup](docs/SMTP_SETUP.md)** - Configure email notifications (Gmail, SendGrid, etc.)
- **[Stripe Setup](docs/STRIPE_SETUP.md)** - Configure online rent payments
- **[Production Deployment](docs/PRODUCTION_SETUP.md)** - Deploy to production

## Available Scripts

### Development
```bash
bun run dev          # Start development server (http://localhost:3000)
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
```

### Testing
```bash
bun run test         # Run tests in watch mode
bun run test:run     # Run tests once
bun run test:coverage # Run tests with coverage report
```

### Database
```bash
bun run db:push      # Push schema changes to database
bun run db:seed      # Seed demo data
bun run db:studio    # Open Drizzle Studio (database UI)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
```

### Background Jobs
```bash
npm run scheduler       # Start scheduler daemon (runs daily at 8am)
npm run scheduler:once  # Run all scheduled jobs once (for testing)
```

## Demo Accounts

After running `bun run db:seed`, the following demo accounts are available (any password works):

### Renters
| Email | Notes |
|-------|-------|
| alice.johnson@demo.com | Has active lease in Sunset Apartments |
| bob.smith@demo.com | Has active lease |
| carol.williams@demo.com | Has active lease in Oak Street Townhomes |
| david.brown@demo.com | Has active lease in Marina View |
| emma.davis@demo.com | Has active lease |
| frank.miller@demo.com | Has active lease in Downtown Lofts |
| grace.wilson@demo.com | Has active lease in Valley Gardens |
| henry.moore@demo.com | Has active lease |
| iris.taylor@demo.com | Has active lease in Hillside Estates |
| jack.anderson@demo.com | No lease - has pending applications |

### Landlords
| Email | Organization |
|-------|--------------|
| john.properties@demo.com | Johnson Properties LLC |
| sarah.realty@demo.com | Realty & Management Group |
| mike.estates@demo.com | Premier Property Management |

### Property Managers
| Email | Organization | Role |
|-------|--------------|------|
| pm.lisa@demo.com | Realty & Management Group | Manager |
| pm.robert@demo.com | Premier Property Management | Owner |
| pm.maria@demo.com | Premier Property Management | Manager |

### Maintenance Workers
| Email | Organization |
|-------|--------------|
| maint.joe@demo.com | Premier Property Management |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── landlord/          # Landlord dashboard pages
│   ├── renter/            # Renter portal pages
│   ├── maintenance/       # Maintenance worker pages
│   ├── api/               # API routes
│   └── ...
├── db/                    # Database layer
│   ├── schema/            # Drizzle schema definitions
│   └── index.ts           # Database connection
├── services/              # Business logic
│   ├── properties.ts      # Property management
│   ├── leases.ts          # Lease management
│   ├── maintenance.ts     # Maintenance requests
│   ├── applications.ts    # Rental applications
│   ├── email.ts           # Email notifications
│   ├── stripe.ts          # Payment processing
│   ├── scheduler.ts       # Background jobs
│   └── ...
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── org-context.ts    # Multi-tenant context
│   └── utils.ts
├── components/            # Shared React components
└── __tests__/            # Test files

scripts/
├── seed-demo-data.ts     # Demo data seeding
└── scheduler.ts          # Background job runner

docs/
├── SMTP_SETUP.md         # Email configuration guide
├── STRIPE_SETUP.md       # Payment configuration guide
└── PRODUCTION_SETUP.md   # Production deployment guide
```

## User Roles

| Role | Access |
|------|--------|
| Owner | Full organization access, billing |
| Admin | Full organization access |
| Manager | Property and tenant management |
| Staff | Limited operational access |
| Renter | Tenant portal only |

## Roadmap

### Completed
- [x] Database layer (Drizzle + SQLite/Postgres)
- [x] Multi-org tenancy
- [x] Property & unit management
- [x] Listing portal
- [x] Application workflow
- [x] Lease management
- [x] Rent tracking
- [x] Maintenance requests with photo uploads
- [x] Reporting dashboard
- [x] Audit logging
- [x] Docker deployment
- [x] Email notifications
- [x] Stripe payment integration
- [x] Background job scheduler
- [x] Mobile responsive UI
- [x] Test framework

### In Progress
- [ ] Document storage (S3/R2)
- [ ] Photo gallery for maintenance tickets

### Planned
- [ ] Payment splitting (PM/Landlord)
- [ ] Background screening integration
- [ ] Listing syndication (Zillow, Apartments.com)
- [ ] Mobile app / PWA
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics & charts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

AGPLv3 - See [LICENSE](./LICENSE) for details.

---

Built with the philosophy that software should be ownable, not rented.
