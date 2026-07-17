FROM node:22-alpine AS builder

WORKDIR /app

# Bật pnpm qua corepack
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml tsconfig.json next.config.ts /app/
RUN pnpm install --frozen-lockfile

COPY app/ /app/app/
COPY lib/ /app/lib/

ARG BACKEND_API_URL=http://backend:8000/api/v1
ENV NODE_ENV=production
ENV BACKEND_API_URL=${BACKEND_API_URL}

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_API_URL=http://backend:8000/api/v1

COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
