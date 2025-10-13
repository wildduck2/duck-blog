FROM node:22-alpine

# Enable pnpm via corepack
RUN corepack enable

# Set working directory to the monorepo root
WORKDIR /app

# Copy monorepo root config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy only necessary package.json files to install workspace dependencies
COPY apps/acme-server/ ./apps/acme-server/
COPY packages/db/ ./packages/db/
COPY packages/libs/ ./packages/libs/
COPY packages/hooks/ ./packages/hooks/
COPY packages/ui/ ./packages/ui/
COPY tooling/typescript/ ./tooling/typescript/
COPY tooling/tsdown/ ./tooling/tsdown/

# Install dependencies with pnpm
RUN pnpm install

# Set working directory to the app
WORKDIR /app/apps/acme-server

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "run", "start:dev"]
