# Use the official Node.js runtime as base image
FROM node:20-alpine

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium instead of downloading
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV CI=false
RUN npm ci --production --silent

# Copy application code
COPY . .

# Railway will set the PORT automatically
# Don't specify EXPOSE as Railway manages this

# Start the application
CMD ["node", "server.js"]