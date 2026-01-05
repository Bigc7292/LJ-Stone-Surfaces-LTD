FROM node:20-slim

# Install openssl for Prisma/Drizzle if needed
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files first to cache dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm list --depth=0 || true
RUN ls -la node_modules/.bin || true
RUN npm run build

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
