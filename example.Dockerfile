# Multi-stage build for OFM (SvelteKit + Bun)
FROM oven/bun:1 AS builder

WORKDIR /app

# Public env vars required at build time ($env/static/public)
# These are safe to hardcode — they are exposed to the browser anyway
ENV PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
ENV PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
ENV PUBLIC_SUPABASE_BUCKET=<bucket-name>

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the SvelteKit application
RUN bun run build

# Production image
FROM oven/bun:1-alpine

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user for security
RUN addgroup -g 1001 -S ofmuser && \
    adduser -S ofmuser -u 1001

# Change ownership of app directory
RUN chown -R ofmuser:ofmuser /app

USER ofmuser

# Expose port (SvelteKit default is 5174, but we'll use 3001 in production)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "try { const res = await fetch('http://localhost:3001/'); process.exit(res.ok ? 0 : 1); } catch { process.exit(1); }"

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Start the SvelteKit server
CMD ["bun", "run", "build/index.js"]
