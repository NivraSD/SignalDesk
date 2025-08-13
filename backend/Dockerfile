# CRITICAL FIX: Force complete rebuild for Niv routes
# NO CACHE - timestamp: 2025-08-13T20:30:00Z
FROM node:20-alpine

WORKDIR /app

# Force cache invalidation
ENV CACHE_BUST=2025-08-13-2030-NIV-ROUTES

# Copy package files first
COPY package*.json ./

# Clean install dependencies
RUN npm ci --only=production

# Copy ALL source files
COPY . .

# Debug: List files to verify Niv routes are included
RUN ls -la src/routes/ || true

# Start server
EXPOSE 3000
CMD ["node", "server.js"]# DEPLOY: 20250813-164927
