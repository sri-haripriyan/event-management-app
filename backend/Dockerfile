# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy the application source code
COPY . .

# Run TypeScript compilation (generates dist/)
RUN npm run build

# Stage 2: Create the minimal production runtime image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled JavaScript files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port (default is 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
