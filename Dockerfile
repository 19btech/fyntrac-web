# Stage 1: Build the app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run the app in production
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3030
USER node
CMD ["npm", "run", "start"]

