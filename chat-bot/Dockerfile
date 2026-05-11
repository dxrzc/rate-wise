ARG NODE_VERSION=22.21.1-alpine3.22@sha256:b2358485e3e33bc3a33114d2b1bdb18cdbe4df01bd2b257198eb51beb1f026c5
ARG NGINX_VERSION=alpine3.23-slim@sha256:6a9338004bea53f33e1d44a0f644ed082c3076b03747566c9535b0c724c98d09 

FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app
EXPOSE 3000

FROM base AS dev-deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM base AS build
COPY --from=dev-deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY index.html ./
COPY tsconfig.* ./
COPY vite.config.ts ./
RUN npm run build

FROM nginx:${NGINX_VERSION} AS production
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN echo "server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files \$uri \$uri/ /index.html; \
    } \
    }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["/entrypoint.sh"]