# FROM node:20-alpine
# # Use a lightweight Node image

# # Set working directory
# WORKDIR /app

# # Install optional tools (useful for debugging)
# RUN apk add --no-cache bash

# # Copy only package files first (so caching works properly)
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Then copy the rest of your app
# COPY . .

# # Build your app (if using TypeScript)
# RUN npx tsc

# # Use development entry point
# CMD ["npm", "run", "dev"]
# Use Node base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Optional: Install bash and tini (handles SIGINT properly)
RUN apk add --no-cache bash

# Install dependencies early to cache them
COPY package*.json ./
RUN npm install

# Copy rest of the application
COPY . .

# Build your app (if using TypeScript)
RUN npx tsc

# Run nodemon
CMD ["npm", "run", "dev"]
