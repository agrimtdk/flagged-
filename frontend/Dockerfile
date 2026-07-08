# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:1.25-alpine AS production

LABEL maintainer="FLAGGED! DevOps <devops@flagged.io>"
LABEL description="Production frontend SPA and reverse proxy for FLAGGED!"
LABEL version="1.0.0"

# Install curl for healthchecks
RUN apk add --no-cache curl

# Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/*

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration files
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
