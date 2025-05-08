# frontend/Dockerfile

# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /app/frontend
COPY package*.json ./

# --- Dependencies Stage ---
FROM base AS dependencies
RUN npm install

# --- Build Stage (for production) ---
FROM dependencies AS build
COPY . .
# Build the Vue app for production
RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine AS production
# Copy the built static files from the build stage
COPY --from=build /app/frontend/dist /usr/share/nginx/html
# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# --- Development Stage ---
FROM dependencies AS development
WORKDIR /app/frontend
ENV NODE_ENV=development
# Source code will be mounted via docker-compose.override.yml, but copy just in case.
# If running without overrides, this ensures code is present.
COPY . .
# Expose Vite default port (check your vite.config if different)
EXPOSE 5173
# Run the Vite dev server, listening on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 