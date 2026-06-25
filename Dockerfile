# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
# Dummy DB URLs so prisma generate succeeds without a real DB at build time
ENV DATABASE_URL="postgresql://user:password@127.0.0.1:5432/nextshift_os?schema=public"
ENV DIRECT_URL="postgresql://user:password@127.0.0.1:5432/nextshift_os?schema=public"
# NEXT_PUBLIC_* must be present at build time so they are embedded in the JS bundle
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_COMMIT_SHA=unknown
ARG NEXT_PUBLIC_BUILD_TIME=unknown
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_COMMIT_SHA=$NEXT_PUBLIC_COMMIT_SHA
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app
ARG NEXT_PUBLIC_COMMIT_SHA=unknown
ARG NEXT_PUBLIC_BUILD_TIME=unknown
RUN apk add --no-cache ffmpeg curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
USER nextjs
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_COMMIT_SHA=$NEXT_PUBLIC_COMMIT_SHA
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://127.0.0.1:3000/api/v1/health || exit 1
CMD ["node", "server.js"]
