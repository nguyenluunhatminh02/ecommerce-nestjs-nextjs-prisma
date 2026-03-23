# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools needed by some native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Resolve tsconfig path aliases (@common/*, @auth/*, etc.) in compiled output
RUN npx tsc-alias -p tsconfig.json


# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# dumb-init: proper PID 1 signal handling
RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --omit=dev

# Prisma generated client (binary engines)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled application
COPY --from=builder /app/dist ./dist

# Prisma schema (needed for prisma migrate deploy)
COPY prisma ./prisma

EXPOSE 4000

CMD ["dumb-init", "node", "dist/main"]
