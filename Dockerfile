# ---------- STAGE 1: Builder ----------
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build


# ---------- STAGE 2: Runner ----------
FROM node:20-alpine

WORKDIR /app

# Install a simple static server
RUN npm install -g serve

# Copy only the built output
COPY --from=builder /app/dist .

# Expose the dynamic port that Cloud Run sets
ENV PORT=8080
EXPOSE 8080

# Run the static server using the Cloud Run port
CMD ["sh", "-c", "serve -s . -l $PORT"]
