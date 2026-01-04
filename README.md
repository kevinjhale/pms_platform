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

- Node.js 18+
- npm or pnpm

### Development

```bash
# Clone the repository
git clone https://github.com/kevinjhale/pms_platform.git
cd pms_platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings (see Configuration below)

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database UI)
```

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
