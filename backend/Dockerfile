# ==========================================
# StreamXI Backend Dockerfile
# Compatible with Windows Server (Docker/WSL2/Mirantis) & Linux
# ==========================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies (including dev for TypeScript build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
USER node

EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
