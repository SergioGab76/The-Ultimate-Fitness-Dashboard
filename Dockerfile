# ----- STAGE 1: Builder -----
# Use a full Node.js image to install and build the app
FROM node:18 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy dependency definitions first for efficient caching
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy the rest of the app’s source code
COPY . .

# Build the optimized static files (output will go to /app/dist for Vite, or /app/build for CRA)
RUN npm run build

# ----- STAGE 2: Runner -----
# Use a lightweight Node.js runtime for serving static files
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install the static file server globally
RUN npm install -g serve

# Copy the built static files from the builder stage
# Adjust path depending on your build system (Vite → dist, CRA → build)
COPY --from=builder /app/dist ./ 

# Cloud Run provides a PORT environment variable (default 8080)
ENV PORT=8080

# Document which port the container listens on
EXPOSE 8080

# Start the web server and bind to the dynamic port
CMD ["sh", "-c", "serve -s . -l $PORT"]
