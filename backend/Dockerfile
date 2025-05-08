# backend/Dockerfile

# --- Base Stage (common dependencies) ---
FROM node:20-alpine AS base
WORKDIR /app/backend
# Copy only package files first
COPY package*.json ./

# --- Dependencies Stage (install all deps) ---
FROM base AS dependencies
# Install all dependencies including devDependencies
RUN npm install

# --- Production Build Stage ---
FROM dependencies AS build
# Copy remaining source code
COPY . .
# Build the TypeScript code
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production
WORKDIR /app/backend
ENV NODE_ENV=production
# Copy necessary files from previous stages
COPY --from=dependencies /app/backend/node_modules ./node_modules
COPY --from=dependencies /app/backend/package*.json ./
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/src/problem_data ./dist/problem_data
EXPOSE 3000
CMD [ "node", "dist/server.js" ]

# --- Development Stage ---
FROM dependencies AS development
WORKDIR /app/backend
ENV NODE_ENV=development
# Copy source code (needed for nodemon/ts-node)
COPY . .
EXPOSE 3000
# Run the dev script using nodemon
CMD ["npm", "run", "dev"] 