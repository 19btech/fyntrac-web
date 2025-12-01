FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./

# Install dependencies WITHOUT scripts (avoids esbuild install errors)
RUN npm ci --ignore-scripts

# Build esbuild manually (multi-arch safe)
RUN npm rebuild esbuild

COPY . .
RUN npm run build


FROM node:20 AS runner
WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# Copy everything needed for production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

RUN npm ci --omit=dev --ignore-scripts
RUN npm rebuild esbuild --omit=dev

CMD ["npm", "start"]
