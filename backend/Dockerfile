# Emergency Dockerfile - Works around Railway cache bug
# FORCE REBUILD: Niv Routes v2.0 - 2025-08-13T20:24:00Z
FROM node:20-alpine

WORKDIR /app

# Copy and install deps
COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

# Start
EXPOSE 3000
CMD ["node", "server.js"]