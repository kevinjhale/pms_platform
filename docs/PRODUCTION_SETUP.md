# Production Deployment Guide

This guide covers deploying PMS Platform to a production environment.

## Deployment Options

### Option 1: Docker (Recommended)

The easiest way to deploy PMS Platform.

#### Prerequisites
- Docker and Docker Compose installed
- A domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

#### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kevinjhale/pms_platform.git
   cd pms_platform
   ```

2. **Create production environment file**:
   ```bash
   cp .env.example .env.production
   ```

3. **Edit `.env.production`** with production values:
   ```env
   # Required
   DATABASE_URL="file:./data/pms.db"
   AUTH_SECRET="$(openssl rand -base64 32)"
   NEXTAUTH_URL="https://your-domain.com"

   # Email (configure for notifications)
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT="587"
   SMTP_USER="apikey"
   SMTP_PASS="your-sendgrid-api-key"
   EMAIL_FROM="noreply@your-domain.com"
   APP_NAME="Your Property Management"

   # Stripe (configure for payments)
   STRIPE_SECRET_KEY="sk_live_xxxxx"
   STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"
   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```

4. **Build and run with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Set up a reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Node.js Process Manager (PM2)

For VPS deployments without Docker.

#### Prerequisites
- Node.js 18+ installed
- PM2 installed (`npm install -g pm2`)
- A domain name and SSL certificate

#### Steps

1. **Clone and install**:
   ```bash
   git clone https://github.com/kevinjhale/pms_platform.git
   cd pms_platform
   npm install
   ```

2. **Create production environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Create PM2 ecosystem file** (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'pms-web',
         script: 'npm',
         args: 'start',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         }
       },
       {
         name: 'pms-scheduler',
         script: 'npx',
         args: 'tsx scripts/scheduler.ts',
         env: {
           NODE_ENV: 'production'
         }
       }
     ]
   };
   ```

5. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 3: Vercel / Netlify

For serverless deployment (note: scheduler requires separate handling).

#### Vercel Steps

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note**: The background scheduler won't work on Vercel. You'll need to:
- Use Vercel Cron Jobs (Pro plan)
- Or use an external scheduler (AWS Lambda, etc.)

### Option 4: Railway / Render

Cloud platforms with easy deployment.

#### Railway Steps

1. Connect your GitHub repository
2. Add environment variables
3. Railway will automatically detect Next.js and deploy

For the scheduler, add a second service:
- Set the start command to `npx tsx scripts/scheduler.ts`

## Database Considerations

### SQLite (Default)

Good for:
- Small deployments (< 1000 units)
- Single-server setups
- Cost-sensitive deployments

Important:
- Mount a persistent volume for `/app/data`
- Regular backups are essential
- Not suitable for multi-server deployments

### PostgreSQL (Recommended for Scale)

Better for:
- Larger deployments
- Multi-server setups
- Better query performance

Setup:
1. Provision a PostgreSQL database (AWS RDS, Supabase, Railway, etc.)
2. Update `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/pms?sslmode=require"
   ```
3. Push schema:
   ```bash
   npm run db:push
   ```

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Using Cloudflare

1. Add your domain to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Cloudflare will handle SSL termination

## Environment Variables Checklist

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./data/pms.db` |
| `AUTH_SECRET` | NextAuth.js secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your deployment | `https://your-domain.com` |

### Recommended

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Email server | `smtp.sendgrid.net` |
| `SMTP_PORT` | Email port | `587` |
| `SMTP_USER` | Email username | `apikey` |
| `SMTP_PASS` | Email password | `SG.xxxxx` |
| `EMAIL_FROM` | From address | `noreply@your-domain.com` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_xxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxxxx` |

## Backup Strategy

### SQLite Backup

```bash
# Create a backup script (backup.sh)
#!/bin/bash
BACKUP_DIR="/backups/pms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /app/data/pms.db "$BACKUP_DIR/pms_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "pms_*.db" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

### PostgreSQL Backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Monitoring

### Health Check Endpoint

PMS Platform provides a health check at `/api/health`:

```bash
curl https://your-domain.com/api/health
# Returns: { "status": "ok", "timestamp": "..." }
```

### Recommended Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom, Better Uptime
- **Logs**: Logtail, Papertrail, Datadog
- **APM**: Sentry, New Relic

### Setting Up Sentry (Error Tracking)

1. Create a Sentry project
2. Install the SDK:
   ```bash
   bun add @sentry/nextjs
   ```
3. Run the setup wizard:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure headers (CSP, HSTS, etc.)
- [ ] Keep dependencies updated
- [ ] Use strong `AUTH_SECRET`
- [ ] Don't expose API keys in client code
- [ ] Regular security audits
- [ ] Enable rate limiting
- [ ] Set up fail2ban for SSH
- [ ] Regular backups tested and verified

## Updating

### Docker Update

```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### PM2 Update

```bash
git pull origin main
npm install
npm run build
pm2 restart all
```

### Database Migrations

After updating, if there are schema changes:

```bash
npm run db:push
```

For zero-downtime migrations, use `db:migrate` with proper migration files.

## Troubleshooting

### Application won't start

1. Check logs: `docker-compose logs` or `pm2 logs`
2. Verify environment variables are set
3. Check database connection
4. Ensure port 3000 is available

### Database errors

1. Check `DATABASE_URL` is correct
2. Verify database file/server is accessible
3. Run `npm run db:push` to sync schema

### Email not sending

1. Check SMTP credentials
2. Verify sender domain is verified
3. Check spam folders
4. Review email logs

### Payments not working

1. Verify Stripe keys are correct (test vs live)
2. Check webhook is configured
3. Verify webhook secret matches
4. Check Stripe Dashboard for errors
