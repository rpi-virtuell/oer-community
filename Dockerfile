FROM node:22-alpine AS bau
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=bau /app/build ./build
COPY --from=bau /app/node_modules ./node_modules
COPY --from=bau /app/package.json ./
EXPOSE 3000
CMD ["node", "build/index.js"]
