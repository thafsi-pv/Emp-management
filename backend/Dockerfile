# Stage 1: Build NestJS application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source
COPY . .

# Build NestJS application
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package management files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and generate client for production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled dist from builder stage
COPY --from=builder /app/dist ./dist

# Create upload directories
RUN mkdir -p uploads/photos uploads/documents

# Expose internal backend port
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
