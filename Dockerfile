# ---------- STAGE 1: Builder ----------
FROM node:20 AS builder

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build


# ---------- STAGE 2: Runner ----------
FROM node:20-alpine

WORKDIR /app

# Install static server
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist .

# Use dynamic port from Cloud Run
ENV PORT=8080
EXPOSE 8080

# ✅ Serve using the dynamic port
CMD ["sh", "-c", "serve -s . -l $PORT"]
