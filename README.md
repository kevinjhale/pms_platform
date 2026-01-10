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
- **Reporting Dashboard** - Occupancy, revenue, maintenance metrics, rent roll
- **Mobile Responsive** - Full mobile support with collapsible navigation
- **Docker Ready** - Container deployment with Docker Compose

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

---

## Deployment Options

Choose your deployment method:

| Method | Best For | Complexity |
|--------|----------|------------|
| [Docker Compose](#docker-deployment-recommended) | Production, VPS, self-hosting | Easy |
| [Local Development](#local-development) | Development, testing | Medium |

---

## Docker Deployment (Recommended)

Deploy the full stack with Docker Compose. This is the easiest way to run PMS Platform.

### Prerequisites

Install Docker on your system:

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from https://www.docker.com/products/docker-desktop
```

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add your user to docker group (logout/login after)
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin
```

#### Windows
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/kevinjhale/pms_platform.git
cd pms_platform

# 2. Create environment file
cp .env.example .env

# 3. Generate a secure AUTH_SECRET
openssl rand -base64 32
# Copy the output and paste it as AUTH_SECRET in .env

# 4. Edit .env with your settings (see Configuration section)
nano .env  # or use your preferred editor

# 5. Build and start containers
docker compose up -d

# 6. Seed demo data (optional, for testing)
docker compose exec web bun run scripts/seed-demo-data.ts

# 7. View logs
docker compose logs -f
```

Visit `http://localhost:3000` (or your server's IP/domain)

### Docker Commands

```bash
# Build containers
docker compose build

# Start services (detached)
docker compose up -d

# Stop services
docker compose down

# View logs (follow mode)
docker compose logs -f

# View logs for specific service
docker compose logs -f web
docker compose logs -f scheduler

# Restart services
docker compose restart

# Seed demo data
docker compose exec web bun run scripts/seed-demo-data.ts

# Access shell in container
docker compose exec web sh

# Update and rebuild
git pull
docker compose build
docker compose up -d
```

### Docker Architecture

```
┌─────────────────────────────────────────────────┐
│              Docker Compose                      │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐      ┌─────────────┐           │
│  │    web      │      │  scheduler  │           │
│  │  (Next.js)  │      │ (cron jobs) │           │
│  │   :3000     │      │             │           │
│  └──────┬──────┘      └──────┬──────┘           │
│         │                    │                  │
│         └────────┬───────────┘                  │
│                  ▼                              │
│         ┌──────────────┐                        │
│         │  pms_data    │                        │
│         │  (SQLite DB) │                        │
│         │   volume     │                        │
│         └──────────────┘                        │
└─────────────────────────────────────────────────┘
```

**Services:**
- **web** - Next.js application server (port 3000)
- **scheduler** - Background job runner (rent reminders, late notices, lease expiry alerts)

**Data Persistence:**
- SQLite database stored in Docker volume `pms_data`
- Data persists across container restarts
- Backup with: `docker compose exec web cat /app/data/pms.db > backup.db`

### Production Deployment

For production deployments, ensure you:

1. **Set a strong AUTH_SECRET** (minimum 32 characters)
2. **Configure NEXTAUTH_URL** to your domain
3. **Use HTTPS** (via reverse proxy like nginx, Caddy, or Traefik)
4. **Configure email** for notifications (see [SMTP Setup](docs/SMTP_SETUP.md))
5. **Configure Stripe** for payments (see [Stripe Setup](docs/STRIPE_SETUP.md))

Example production `.env`:
```env
AUTH_SECRET="your-secure-random-string-at-least-32-chars"
NEXTAUTH_URL="https://pms.yourdomain.com"
DATABASE_URL="file:/app/data/pms.db"

# Email (required for notifications)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"
APP_NAME="Your Property Management"

# Stripe (required for payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

See [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md) for complete production setup guide.

---

## Local Development

For development and testing without Docker.

### Prerequisites

#### Install Bun (JavaScript Runtime)

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify installation:
```bash
bun --version
```

#### Install Git

**macOS:**
```bash
xcode-select --install
# or
brew install git
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install git
```

**Windows:**
Download from https://git-scm.com/download/win

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/kevinjhale/pms_platform.git
cd pms_platform

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your settings

# 4. Initialize the database
bun run db:push

# 5. Seed demo data (recommended)
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

# Terminal 2: Start the background scheduler (optional)
bun run scheduler

# Terminal 3: Start Stripe webhook listener (optional)
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### Stripe Setup (Payment Processing)

Stripe enables online rent payments. See [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) for full details.

#### Local Development

1. **Install the Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (via winget)
   winget install Stripe.StripeCLI

   # Windows (via scoop)
   scoop install stripe

   # Linux (Debian/Ubuntu)
   curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
   sudo apt update && sudo apt install stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Start the webhook listener**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   Copy the `whsec_...` secret displayed and add it to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
   ```

4. **Keep the CLI running** while testing payments

#### Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |

Use any future expiration date and any 3-digit CVC.

### Production Build (without Docker)

```bash
# Build for production
bun run build

# Start production server
bun run start

# Start background scheduler (separate process)
bun run scheduler
```

---

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

---

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
bun run scheduler       # Start scheduler daemon (runs daily at 8am)
bun run scheduler:once  # Run all scheduled jobs once (for testing)
```

### Docker
```bash
bun run docker:build   # Build Docker containers
bun run docker:up      # Start services (detached)
bun run docker:down    # Stop services
bun run docker:logs    # View logs (follow mode)
bun run docker:seed    # Seed demo data in container
```

---

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

---

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

---

## User Roles

| Role | Access |
|------|--------|
| Owner | Full organization access, billing |
| Admin | Full organization access |
| Manager | Property and tenant management |
| Staff | Limited operational access |
| Renter | Tenant portal only |

---

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
- [x] Photo gallery with lightbox viewer
- [x] Reporting dashboard
- [x] Rent Roll report
- [x] Audit logging
- [x] Docker deployment
- [x] Email notifications
- [x] Stripe payment integration
- [x] Background job scheduler
- [x] Mobile responsive UI
- [x] Test framework

### Planned
- [ ] Document storage (S3/R2)
- [ ] Payment splitting (PM/Landlord)
- [ ] Background screening integration
- [ ] Listing syndication (Zillow, Apartments.com)
- [ ] Mobile app / PWA
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics & charts

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## License

AGPLv3 - See [LICENSE](./LICENSE) for details.

---

Built with the philosophy that software should be ownable, not rented.
