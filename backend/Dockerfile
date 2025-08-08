# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV CI=false
RUN npm install --production

# Copy application code
COPY . .

# Railway will set the PORT automatically
# Don't specify EXPOSE as Railway manages this

# Start the application
CMD ["node", "index.js"]