# PMS Platform

A self-hostable property management system built with Next.js. Own your data, run it yourself.

## Features

- **Multi-tenant Architecture** - Support multiple organizations (property managers, landlords)
- **Property & Unit Management** - Full CRUD for properties and units
- **Listing Portal** - Public listings for renters to browse and apply
- **Application Workflow** - Submit, review, approve/reject applications
- **Lease Management** - Create leases, track terms, manage renewals
- **Rent Tracking** - Due dates, payment recording, late fee tracking
- **Maintenance Requests** - Tenant submissions, landlord management, comments
- **Reporting Dashboard** - Occupancy, revenue, maintenance, lease metrics
- **Audit Logging** - Compliance-ready activity tracking
- **Docker Ready** - Single container deployment

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (default) or PostgreSQL
- **ORM**: Drizzle
- **Auth**: NextAuth.js v5
- **Styling**: CSS (no framework)

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun 1.0+)
- Bun (recommended) or npm

### Development

```bash
# Clone the repository
git clone https://github.com/kevinjhale/pms_platform.git
cd pms_platform

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings (see Configuration below)

# Push database schema
bun run db:push

# Seed demo data (optional)
bun run db:seed

# Start development server
bun run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start
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

Create a `.env` file in the project root:

```env
# Database (SQLite - default)
DATABASE_URL="file:./data/pms.db"

# Or PostgreSQL
# DATABASE_URL="postgresql://user:pass@localhost:5432/pms"

# Authentication (required)
AUTH_SECRET="generate-a-random-string-here"

# OAuth Providers (optional)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Base URL (for production)
NEXTAUTH_URL="https://your-domain.com"
```

### Generating AUTH_SECRET

```bash
openssl rand -base64 32
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── landlord/          # Landlord dashboard pages
│   ├── renter/            # Renter portal pages
│   ├── api/               # API routes
│   └── ...
├── db/                    # Database layer
│   ├── schema/            # Drizzle schema definitions
│   └── index.ts           # Database connection
├── services/              # Business logic
│   ├── properties.ts
│   ├── leases.ts
│   ├── maintenance.ts
│   └── ...
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── org-context.ts    # Multi-tenant context
│   └── utils.ts
└── components/            # Shared React components
```

## Database Schema

Core entities:

- **Organizations** - Property management companies or independent landlords
- **Users** - With roles (admin, manager, staff, renter)
- **Properties** - Buildings or property groups
- **Units** - Individual rentable units
- **Leases** - Tenant agreements with terms
- **Rent Payments** - Payment tracking per period
- **Maintenance Requests** - Work orders with comments
- **Applications** - Rental applications
- **Audit Logs** - Activity tracking

## Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run db:push      # Push schema to database
bun run db:seed      # Seed demo data
bun run db:studio    # Open Drizzle Studio (database UI)
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

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
GET/POST /api/auth/[...nextauth]
```

## User Roles

| Role | Access |
|------|--------|
| Admin | Full organization access |
| Manager | Property and tenant management |
| Staff | Limited operational access |
| Renter | Tenant portal only |

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full feature roadmap.

### Completed
- [x] Database layer (Drizzle + SQLite/Postgres)
- [x] Multi-org tenancy
- [x] Property & unit management
- [x] Listing portal
- [x] Application workflow
- [x] Docker deployment
- [x] Lease management
- [x] Rent tracking
- [x] Maintenance requests
- [x] Reporting dashboard
- [x] Audit logging

### In Progress
- [ ] Stripe Connect integration
- [ ] Admin plugin UI

### Planned
- [ ] Payment splitting (PM/Landlord)
- [ ] Document storage (S3/R2)
- [ ] Email notifications
- [ ] Background screening
- [ ] Listing syndication
- [ ] Mobile app / PWA

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
