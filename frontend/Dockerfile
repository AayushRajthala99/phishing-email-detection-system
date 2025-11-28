# ----- Stage 1: Build the React App -----
# Use an official Node.js image as the base
FROM node:22-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Build the app for production
RUN npm run build

# ----- Stage 2: Serve the App with Nginx -----
# Use a lightweight Nginx image
FROM nginx:1.27-alpine

# Copy the build output (static files) from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]