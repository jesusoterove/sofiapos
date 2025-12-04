# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# First, build sofia-ui library
# Copy sofia-ui package files
COPY sofia-ui/package.json sofia-ui/package-lock.json* ./sofia-ui/
WORKDIR /app/sofia-ui
RUN npm ci || npm install
COPY sofia-ui/ .
RUN npm run build

# Now build console app
WORKDIR /app/console

# Copy console package files
COPY console/package.json console/package-lock.json* ./

# Install dependencies (this will link to the local sofia-ui)
RUN npm ci || npm install

# Copy console source files
COPY console/ .

# Build the console app
RUN npm run build

# Development stage (for hot reload)
FROM node:20-alpine AS development

WORKDIR /app

# Build sofia-ui first
COPY sofia-ui/package.json sofia-ui/package-lock.json* ./sofia-ui/
WORKDIR /app/sofia-ui
RUN npm ci || npm install
COPY sofia-ui/ .
RUN npm run build

# Setup console
WORKDIR /app/console
COPY console/package.json console/package-lock.json* ./
RUN npm ci || npm install
COPY console/ .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production stage
FROM nginx:alpine AS production

# Copy built files from builder
COPY --from=builder /app/console/dist /usr/share/nginx/html

# Copy nginx configuration (if you have one)
# COPY console/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
