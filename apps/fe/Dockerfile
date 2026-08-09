# Step 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NUXT_PUBLIC_API_BASE_URL
ENV NUXT_PUBLIC_API_BASE_URL=$NUXT_PUBLIC_API_BASE_URL
RUN npm run build

# Step 2: Run stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
