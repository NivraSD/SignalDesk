# Simple Railway Dockerfile for debugging
FROM node:20-slim

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies from backend folder
WORKDIR /app/backend
RUN npm install --production

# Go back to app root
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Start the minimal server
CMD ["node", "backend/server-minimal.js"]