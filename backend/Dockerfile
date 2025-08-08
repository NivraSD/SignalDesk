# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Debug and install dependencies (avoiding npm ci)
RUN node --version && npm --version
RUN npm cache clean --force
RUN npm install --production --no-optional --verbose

# Copy application code
COPY . .

# Expose port (Railway will override this)
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]