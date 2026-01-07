# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.21.1-alpine3.22@sha256:b2358485e3e33bc3a33114d2b1bdb18cdbe4df01bd2b257198eb51beb1f026c5

FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app
EXPOSE 3000

FROM base AS dev-deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM base AS prod-deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM base AS builder
COPY --from=dev-deps /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY package.json tsconfig*.json ./
RUN npm run build

FROM base AS development
COPY --from=dev-deps /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./
ENV NODE_ENV=development
CMD ["npx", "nest", "start", "-w"] 

FROM base AS production
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/main.js"] 