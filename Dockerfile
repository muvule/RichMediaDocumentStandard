# Multi-stage Docker build for RMD CLI and Ingestion Runtime
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/cli/package*.json ./packages/cli/
COPY packages/playground/package*.json ./packages/playground/

RUN npm ci

COPY . .
RUN npm run build --workspace=@rmd/core && npm run build --workspace=@rmd/cli

FROM node:20-alpine AS runner

WORKDIR /workspace

# Install RMD CLI globally in container
COPY --from=builder /app /app
RUN npm install -g /app/packages/core /app/packages/cli

ENTRYPOINT ["rmd"]
CMD ["--help"]
