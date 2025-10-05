# ----- STAGE 1: The Builder -----
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ----- STAGE 2: The Runner -----
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build .
EXPOSE 3000
CMD [ "serve", "-s", ".", "-l", "3000" ]