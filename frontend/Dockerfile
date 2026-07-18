# Multi-stage build for Next.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json next.config.ts /app/
RUN npm ci

COPY app/ /app/app/
COPY lib/ /app/lib/

ARG BACKEND_API_URL=http://backend:8000/api/v1
ENV NODE_ENV=production
ENV BACKEND_API_URL=${BACKEND_API_URL}

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_API_URL=http://backend:8000/api/v1

COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
