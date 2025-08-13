# OVERRIDE DOCKERFILE - Forces Railway to use this instead of cached version
# This Dockerfile deliberately avoids cache mounts that cause EBUSY errors

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install - NO CACHE MOUNTS
RUN rm -rf node_modules .npm && \
    npm ci --verbose

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]