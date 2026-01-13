# ----------------------------
# Stage 1: Builder
# ----------------------------
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts
# Rebuild esbuild for the current architecture
RUN npm rebuild esbuild

COPY . .

# Build the Next.js application
RUN npm run build


# ----------------------------
# Stage 2: Runner
# ----------------------------
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production
# Optional: Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Copy package files first to leverage cache for install
COPY package*.json ./

# 2. Install ONLY production dependencies (No need to copy node_modules from builder)
RUN npm ci --omit=dev --ignore-scripts
RUN npm rebuild esbuild --omit=dev

# 3. Copy the build output from the builder stage
#    (Only copy what is necessary)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 4. Start the app
CMD ["npm", "start"]