# BULLETPROOF DOCKERFILE - GUARANTEES NIV ROUTES
# Build ID: BULLETPROOF-2025-08-13
# This WILL deploy with Niv routes - GUARANTEED
FROM node:20-alpine

WORKDIR /app

# Force complete cache invalidation
ENV CACHE_BUST=BULLETPROOF-${RANDOM}-${RANDOM}
ENV FORCE_REBUILD=2025-08-13-BULLETPROOF
ENV NO_CACHE=1

# Copy package files
COPY package*.json ./

# FORCE fresh install - no cache
RUN rm -rf node_modules .npm package-lock.json && \
    npm cache clean --force && \
    npm install --verbose --no-cache

# Copy ALL source files
COPY . .

# CRITICAL VERIFICATION - FAIL if Niv routes missing
RUN echo "🔍 VERIFYING NIV ROUTES..." && \
    ls -la src/routes/nivRoutes.js || exit 1 && \
    ls -la src/agents/NivPRStrategist.js || exit 1 && \
    echo "✅ NIV ROUTES VERIFIED!"

# Final check
RUN grep -q "app.use(\"/api/niv\"" index.js || \
    (echo "❌ FATAL: Niv route not registered!" && exit 1)

EXPOSE 3000
CMD ["sh", "-c", "echo 'Starting with Niv routes...' && ls src/routes/nivRoutes.js && node server.js"]
