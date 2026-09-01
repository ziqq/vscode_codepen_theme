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
