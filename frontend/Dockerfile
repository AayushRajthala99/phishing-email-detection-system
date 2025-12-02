# Stage 1: Build Next.js app
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Run the app
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built output and node_modules
COPY --from=build /app ./

# Expose Next.js port
EXPOSE 3000

# Run Next.js
CMD ["npm", "start"]
