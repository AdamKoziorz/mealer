FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/schemas/package.json packages/schemas/package.json

RUN pnpm install --filter mealer-backend... --frozen-lockfile

COPY apps/backend apps/backend
COPY packages/schemas packages/schemas

RUN node apps/backend/node_modules/typescript/bin/tsc -p packages/schemas/tsconfig.json
RUN pnpm --filter mealer-backend build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/schemas/package.json ./packages/schemas/package.json
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
WORKDIR /app/apps/backend
USER node
CMD ["node", "dist/server.js"]
