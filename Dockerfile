FROM node:24.13.0-bookworm-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html lab.html live.html replay.html vite.config.mjs ./
COPY src ./src
RUN npm run build

FROM node:24.13.0-bookworm-slim@sha256:4660b1ca8b28d6d1906fd644abe34b2ed81d15434d26d845ef0aced307cf4b6f
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
COPY runner/protocol.mjs ./runner/protocol.mjs
COPY scripts/session.mjs ./scripts/session.mjs
RUN mkdir /data && chown node:node /data
USER node
ENV HOST=0.0.0.0 CONTROL_HOST=0.0.0.0 DATA_DIR=/data ALLOW_DEMO=1
EXPOSE 4318 4319
CMD ["node", "server/server.mjs"]
