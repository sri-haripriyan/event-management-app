# Use official Node.js LTS lightweight Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only to optimize image size
RUN npm ci --only=production

# Copy all application source files
COPY . .

# Expose the application port (defaulting to 5001)
EXPOSE 5001

# Start the server in production mode
CMD ["node", "server.js"]
