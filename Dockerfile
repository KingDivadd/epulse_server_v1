# Base image for building
FROM node:20 as base

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json if available
COPY package.json package-lock.json ./

# List files to verify copy
RUN ls -al /app

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source files and tsconfig.json
COPY src ./src
COPY tsconfig.json ./

# List files to verify copy
RUN ls -al /app

# Build the project
RUN npm run build

# Production image
FROM node:20

# Set working directory
WORKDIR /app

# Copy built files and node_modules from base image
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma

# List files to verify copy
RUN ls -al /app

# Expose port and start the application
EXPOSE 4000
CMD ["npm", "run", "start", "--host", "0.0.0.0", "--port", "4000"]