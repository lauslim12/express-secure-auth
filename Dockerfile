# 1st: Use Node to download all dependencies and to build the project.
# Download Node.js image.
FROM node:16.3.0 AS builder

# Set working directory.
WORKDIR /express-secure-auth

# Copy 'package.json' and 'yarn.lock' for deterministic builds.
COPY package.json yarn.lock ./

# Install application (development).
RUN yarn --frozen-lockfile

# Copy our installed API to our working directory.
COPY . ./

# Build TypeScript project.
RUN yarn build

# 2nd: Final stage to sort everything out.
FROM node:16.3.0-alpine AS prod

# Set working directory.
WORKDIR /express-secure-auth

# Copy dependencies.
COPY package.json yarn.lock ./

# Install application (production)
RUN yarn install --production

# Copy previous built TypeScript project.
COPY --from=builder /express-secure-auth/dist ./dist

# Run container as non-root user.
RUN adduser -D nonroot-container-user
USER nonroot-container-user

# Expose port.
EXPOSE 8080