# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Add build arguments for Next.js (required at build time)
ARG NEXT_PUBLIC_MAPBOX_TOKEN

# Set them as env variables during build
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy necessary files from build stage
COPY --from=build /app/next.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Environment variables
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# Start Next.js server locally on port 80
CMD ["npm", "start", "--", "-p", "80"]
