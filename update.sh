#!/bin/bash
#
# PMS Platform Update Script
#
# Pulls latest changes from main branch and redeploys.
# Safe to run anytime - handles zero-downtime updates.
#
# Usage: bash update.sh
#    or: curl -fsSL https://raw.githubusercontent.com/kevinjhale/pms_platform/main/update.sh | bash
#

set -e

APP_DIR="/opt/pms"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}>>>${NC} $1"; }
log_warn() { echo -e "${YELLOW}>>>${NC} $1"; }
log_error() { echo -e "${RED}>>>${NC} $1"; }

echo ""
echo "=========================================="
echo "   PMS Platform Update Script"
echo "=========================================="
echo ""

cd "${APP_DIR}"

# -------------------------------------------
# Step 1: Pull Latest Changes
# -------------------------------------------
log_info "Pulling latest changes from main branch..."
git fetch origin
git reset --hard origin/main

# Show what changed
echo ""
log_info "Recent commits:"
git log --oneline -5
echo ""

# -------------------------------------------
# Step 2: Rebuild Containers
# -------------------------------------------
log_info "Rebuilding Docker containers..."
docker compose build

# -------------------------------------------
# Step 3: Restart with New Images
# -------------------------------------------
log_info "Restarting application..."
docker compose down
docker compose up -d

# -------------------------------------------
# Step 4: Run Database Migrations (if any)
# -------------------------------------------
log_info "Checking for database migrations..."
sleep 10  # Wait for app to start

HEALTH_STATUS=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_STATUS" | grep -q "no such table"; then
    log_info "Running database migrations..."
    docker compose exec -T web npx drizzle-kit push
fi

# -------------------------------------------
# Step 5: Verify Health
# -------------------------------------------
log_info "Verifying application health..."
MAX_ATTEMPTS=12
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    HEALTH=$(curl -s http://localhost:3000/api/health)
    if echo "$HEALTH" | grep -q "healthy"; then
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "  Waiting for healthy status... (${ATTEMPT}/${MAX_ATTEMPTS})"
    sleep 5
done

FINAL_HEALTH=$(curl -s http://localhost:3000/api/health)
if echo "$FINAL_HEALTH" | grep -q "healthy"; then
    echo ""
    echo "=========================================="
    echo -e "${GREEN}   Update Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Application is healthy and running the latest code."
    echo ""
    echo "View logs: docker compose logs -f"
    echo ""
else
    echo ""
    log_error "Application may not be healthy: $FINAL_HEALTH"
    echo "Check logs: docker compose logs"
    exit 1
fi
