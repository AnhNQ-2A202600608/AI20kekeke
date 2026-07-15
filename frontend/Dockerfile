# Multi-stage build for Next.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* tsconfig.json next.config.ts /app/

# Install node dependencies
RUN npm install

# Copy pages source
COPY app/ /app/app/
COPY lib/ /app/lib/

# Set env to production
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Build application
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy output files from builder
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/public /app/public

EXPOSE 3000

# Start Next.js server
CMD ["npm", "run", "start"]
