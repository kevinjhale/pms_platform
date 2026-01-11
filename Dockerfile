# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS base

# Install dependencies for better-sqlite3 native compilation and scripts
RUN apk add --no-cache python3 make g++ sqlite nodejs npm && \
    npm install -g tsx

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM base AS deps
WORKDIR /app

COPY package.json bun.lock* package-lock.json* ./
RUN bun install

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory for SQLite during build
RUN mkdir -p /app/data

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/pms.db"
RUN bun run build

# =============================================================================
# Stage 3: Production Runner
# =============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy additional files needed for scheduler and database migrations
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default command - run the web server
CMD ["node", "server.js"]
