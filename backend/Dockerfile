# Emergency Dockerfile - Works around Railway cache bug
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