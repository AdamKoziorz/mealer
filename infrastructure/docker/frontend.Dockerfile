FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/schemas/package.json packages/schemas/package.json

RUN pnpm install --filter mealer-frontend... --frozen-lockfile

COPY apps/frontend apps/frontend
COPY packages/schemas packages/schemas

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN node apps/frontend/node_modules/typescript/bin/tsc -p packages/schemas/tsconfig.json
RUN pnpm --filter mealer-frontend build

FROM nginx:alpine
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY infrastructure/nginx/nginx.conf /etc/nginx/conf.d/default.conf
