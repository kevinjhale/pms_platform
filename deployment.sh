#!/bin/bash
#
# PMS Platform Deployment Script
#
# This script is idempotent - safe to run multiple times.
# It will skip steps that are already completed.
#
# Usage: curl -fsSL https://raw.githubusercontent.com/kevinjhale/pms_platform/main/deployment.sh | bash
#    or: bash deployment.sh
#

set -e

# Configuration - Update these for your deployment
DOMAIN="${DOMAIN:-halestormsw.com}"
APP_DIR="/opt/pms"
REPO_URL="https://github.com/kevinjhale/pms_platform.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}>>>${NC} $1"; }
log_warn() { echo -e "${YELLOW}>>>${NC} $1"; }
log_error() { echo -e "${RED}>>>${NC} $1"; }

echo ""
echo "=========================================="
echo "   PMS Platform Deployment Script"
echo "=========================================="
echo ""
echo "Domain: ${DOMAIN}"
echo "App Directory: ${APP_DIR}"
echo ""

# -------------------------------------------
# Step 1: System Updates
# -------------------------------------------
log_info "Updating system packages..."
apt update && apt upgrade -y

# -------------------------------------------
# Step 2: Add Swap Space (if not exists)
# -------------------------------------------
if [ -f /swapfile ]; then
    log_warn "Swap file already exists, skipping..."
else
    log_info "Adding 2GB swap space..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log_info "Swap space added"
fi

# -------------------------------------------
# Step 3: Install Docker (if not installed)
# -------------------------------------------
if command -v docker &> /dev/null; then
    log_warn "Docker already installed, skipping..."
else
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
fi

# Install Docker Compose plugin if not present
if docker compose version &> /dev/null; then
    log_warn "Docker Compose already installed, skipping..."
else
    log_info "Installing Docker Compose plugin..."
    apt install -y docker-compose-plugin
fi

# -------------------------------------------
# Step 4: Install Caddy (if not installed)
# -------------------------------------------
if command -v caddy &> /dev/null; then
    log_warn "Caddy already installed, skipping..."
else
    log_info "Installing Caddy web server..."
    apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
fi

# -------------------------------------------
# Step 5: Clone or Update Repository
# -------------------------------------------
if [ -d "${APP_DIR}/.git" ]; then
    log_warn "Repository exists, pulling latest changes..."
    cd "${APP_DIR}"
    git fetch origin
    git reset --hard origin/main
else
    log_info "Cloning repository..."
    mkdir -p "${APP_DIR}"
    git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"

# -------------------------------------------
# Step 6: Create/Update Environment File
# -------------------------------------------
if [ -f "${APP_DIR}/.env" ]; then
    log_warn ".env file exists, preserving existing configuration..."
else
    log_info "Creating .env file..."
    AUTH_SECRET=$(openssl rand -base64 32)
    cat > "${APP_DIR}/.env" << EOF
# Database
DATABASE_URL="file:/app/data/pms.db"

# Authentication (auto-generated - do not change)
AUTH_SECRET="${AUTH_SECRET}"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="https://${DOMAIN}"

# Application
APP_NAME="PMS Platform"

# Email (optional - configure in UI at /landlord/settings/integrations)
# SMTP_HOST=""
# SMTP_PORT="587"
# SMTP_USER=""
# SMTP_PASS=""
# EMAIL_FROM=""

# Stripe (optional - configure in UI at /landlord/settings/integrations)
# STRIPE_SECRET_KEY=""
# STRIPE_PUBLISHABLE_KEY=""
# STRIPE_WEBHOOK_SECRET=""
EOF
    log_info ".env file created with secure AUTH_SECRET"
fi

# -------------------------------------------
# Step 7: Configure Caddy
# -------------------------------------------
log_info "Configuring Caddy for HTTPS..."
cat > /etc/caddy/Caddyfile << EOF
${DOMAIN} {
    reverse_proxy localhost:3000
}
EOF

systemctl restart caddy
systemctl enable caddy

# -------------------------------------------
# Step 8: Stop Existing Containers (if running)
# -------------------------------------------
log_info "Stopping any existing containers..."
cd "${APP_DIR}"
docker compose down 2>/dev/null || true

# -------------------------------------------
# Step 9: Build and Start Containers
# -------------------------------------------
log_info "Building Docker containers (this may take a few minutes)..."
docker compose build

log_info "Starting application..."
docker compose up -d

# -------------------------------------------
# Step 10: Wait for Application to be Ready
# -------------------------------------------
log_info "Waiting for application to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        log_info "Application is healthy!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "  Waiting... (${ATTEMPT}/${MAX_ATTEMPTS})"
    sleep 5
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    log_error "Application failed to become healthy. Check logs with: docker compose logs"
    exit 1
fi

# -------------------------------------------
# Step 11: Initialize Database (if needed)
# -------------------------------------------
log_info "Checking database..."
HEALTH_STATUS=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_STATUS" | grep -q "no such table"; then
    log_info "Initializing database schema..."
    docker compose exec -T web npx drizzle-kit push
fi

# -------------------------------------------
# Step 12: Seed Demo Data (optional, first run only)
# -------------------------------------------
# Check if data already exists by looking at organizations count
ORG_COUNT=$(docker compose exec -T web node -e "
const Database = require('better-sqlite3');
const db = new Database('/app/data/pms.db');
const count = db.prepare('SELECT COUNT(*) as count FROM organizations').get();
console.log(count.count);
" 2>/dev/null || echo "0")

if [ "$ORG_COUNT" = "0" ]; then
    log_info "Seeding demo data..."
    docker compose exec -T web npx tsx scripts/seed-demo-data.ts
else
    log_warn "Database already has data, skipping seed..."
fi

# -------------------------------------------
# Complete!
# -------------------------------------------
echo ""
echo "=========================================="
echo -e "${GREEN}   Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Your PMS Platform is live at: https://${DOMAIN}"
echo ""
echo "Demo logins (any password works):"
echo "  Landlord:    john.properties@demo.com"
echo "  Renter:      alice.johnson@demo.com"
echo "  Manager:     pm.lisa@demo.com"
echo "  Maintenance: maint.joe@demo.com"
echo ""
echo "Useful commands:"
echo "  View logs:     cd ${APP_DIR} && docker compose logs -f"
echo "  Restart:       cd ${APP_DIR} && docker compose restart"
echo "  Update:        cd ${APP_DIR} && git pull && docker compose build && docker compose up -d"
echo "  Stop:          cd ${APP_DIR} && docker compose down"
echo ""
