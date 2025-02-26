# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY src/frontend/package*.json ./
RUN npm install
COPY src/frontend ./
RUN npm run build

# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Final stage
FROM node:18-alpine AS runtime
RUN apk add --no-cache \
    imagemagick \
    ghostscript \
    # Only include necessary runtime libraries
    libwebp \
    jpeg \
    libpng \
    tiff \
    zlib \
    # Install syncthing binary directly
    && wget -O /tmp/syncthing.tar.gz https://github.com/syncthing/syncthing/releases/download/v1.29.2/syncthing-linux-amd64-v1.29.2.tar.gz \
    && tar -xzf /tmp/syncthing.tar.gz -C /tmp \
    && mv /tmp/syncthing-linux-amd64-v1.29.2/syncthing /usr/local/bin \
    && chmod +x /usr/local/bin/syncthing \
    && rm -rf /tmp/* \
    # Create necessary directories
    && mkdir -p /app /sync /app/data \
    && chown -R node:node /app /sync

# Copy ImageMagick policy
COPY policy.xml /etc/ImageMagick-7/policy.xml

WORKDIR /app

# Copy only necessary files from builders
COPY --from=frontend-builder /app/build ./src/frontend/build
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src/backend ./src/backend
COPY --from=backend-builder /app/package.json ./

# Copy entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node

EXPOSE 3000 8384

ENTRYPOINT ["/entrypoint.sh"]