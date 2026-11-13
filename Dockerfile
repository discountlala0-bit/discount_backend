FROM node:20-alpine

# Install OpenSSL for Prisma support on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema first for efficient Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose application port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]

