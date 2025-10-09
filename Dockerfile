# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.19.0-alpine3.22@sha256:d2166de198f26e17e5a442f537754dd616ab069c47cc57b889310a717e0abbf9

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

FROM base AS e2e
COPY --from=dev-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
ENV NODE_ENV=e2e
CMD ["node", "dist/main.js"] 