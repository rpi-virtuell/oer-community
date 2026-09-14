FROM node:24-alpine AS bau
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=bau /app/build ./build
COPY --from=bau /app/node_modules ./node_modules
COPY --from=bau /app/package.json ./
# Die Themen-Tabelle wird zur Laufzeit aus daten/ gelesen (src/lib/themen.js);
# ohne sie antwortet jede Übersicht mit 500. Der Spiegel schreibt sein
# daten/spiegel.json daneben — dafür braucht der Container ein Volume
# (docker-compose.yml, docs/betrieb.md).
COPY --from=bau /app/daten/themen.json ./daten/
EXPOSE 3000
CMD ["node", "build/index.js"]
