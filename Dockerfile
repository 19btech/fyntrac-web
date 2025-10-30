# Stage 1: Build the app
FROM node:20-slim AS builder

WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files (including public folder and fonts)
COPY . .

# Verify fonts exist
RUN ls -la public/fonts

# Build Next.js app
RUN npm run build

# Stage 2: Run the app
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3030

CMD ["npm", "start"]
