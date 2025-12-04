# Build stage for sofia-ui library
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the library
RUN npm run build

# Output stage - just the dist folder
FROM scratch AS export
COPY --from=builder /app/dist /dist

