# Multi-stage image with arguments, variables, flags, and a health check.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS dependencies

WORKDIR /workspace
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS build
ENV NODE_ENV=production \
    THEME_NAME="CodePen Theme Original"
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
LABEL org.opencontainers.image.title="codepen-theme-preview"
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:8080/ || exit 1
USER nginx
CMD ["nginx", "-g", "daemon off;"]

# ---------------------------------------------------------------------------
# Extended showcase: build args, heredocs, multi-platform stages, mounts.
# ---------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS assets
ARG THEME_VERSION=1.0.0
ARG TARGETARCH
ENV NODE_ENV=production \
    THEME_VERSION=${THEME_VERSION} \
    PATH="/workspace/node_modules/.bin:${PATH}"
LABEL org.opencontainers.image.title="CodePen Theme" \
      org.opencontainers.image.version="${THEME_VERSION}"
WORKDIR /workspace
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    npm ci --omit=dev && npm cache verify
COPY --chown=node:node --chmod=644 ./src ./src
RUN <<EOT
  set -eux
  echo "building ${THEME_VERSION} for ${TARGETARCH}"
  npm run build
EOT
SHELL ["/bin/ash", "-eo", "pipefail", "-c"]
ONBUILD COPY . /app
VOLUME ["/data"]
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/env", "node"]
CMD ["src/index.js", "--port", "8080"]
