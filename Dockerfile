# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Define build arguments for Supabase (consumed during build)
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

# Set environment variables for the build process
# Vite (our build tool) requires the VITE_ prefix to bake them into the JS
ENV VITE_SUPABASE_URL=$SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Copy package files and install dependencies
# 'npm ci' is preferred for predictable builds in Docker
COPY package*.json ./
RUN npm ci

# Copy the source code
COPY . .

# Build the application (transforms .tsx to optimized .js/.css in /dist)
RUN npm run build

# Stage 2: Serve the application using a Node-based static server
FROM node:20-slim

WORKDIR /app

# Install 'serve' globally to host the static files
RUN npm install -g serve

# Copy only the compiled /dist folder from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000 as configured in the README
EXPOSE 3000

# Start the server
# -s: SPA mode (handles client-side routing by serving index.html for 404s)
# -l: Listen on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]