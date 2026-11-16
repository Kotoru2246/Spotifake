# Essentia Audio Analysis Service Dockerfile
FROM node:20-alpine
WORKDIR /app

# Install build dependencies if needed for native modules
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose Essentia API port
EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

CMD ["node", "server.js"]
