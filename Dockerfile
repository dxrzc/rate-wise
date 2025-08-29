# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.18.0-bookworm-slim@sha256:752ea8a2f758c34002a0461bd9f1cee4f9a3c36d48494586f60ffce1fc708e0e

FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app
EXPOSE 3000

FROM base AS dev-deps
COPY package*.json ./
RUN npm ci

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS builder
COPY --from=dev-deps /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY package.json . 
COPY tsconfig*.json ./
RUN npm run build

FROM base AS development
COPY --from=dev-deps /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./tsconfig.json
ENV NODE_ENV=development
CMD ["npx", "nest", "start", "-w"] 