# ----- STAGE 1: The Builder -----
# Start with a full Node.js image to get all the build tools
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install all project dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# Run the build command to create the final optimized app
RUN npm run build

# ----- STAGE 2: The Runner -----
# Start with a lightweight, minimal Node.js image for the final container
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install 'serve', the static web server
RUN npm install -g serve

# --- THIS IS THE CORRECTED LINE ---
# Copy ONLY the built application (from the 'dist' folder) from the 'builder' stage
COPY --from=builder /app/dist .

# Tell Cloud Run that the server inside the container will listen on port 3000
EXPOSE 3000

# The command to start the web server and serve the app
CMD [ "serve", "-s", ".", "-l", "3000" ]