# Built with the API client sources as the extra build context `api-client`
# (make docker/build sets it to the sermas-api-client checkout): the build
# bundles them, so the image needs no published client.
FROM node:24-slim AS build

WORKDIR /app/sermas-cli
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --from=api-client src /app/sermas-api-client/src
COPY src ./src
COPY tsconfig.json tsup.config.ts ./
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:24-slim AS cli

WORKDIR /cli
COPY --from=build /app/sermas-cli/package.json ./
COPY --from=build /app/sermas-cli/node_modules ./node_modules
COPY --from=build /app/sermas-cli/dist ./dist
RUN npm link . && mkdir /data

ENV BASE_URL=http://172.17.0.1:8080
ENV CONFIG_DIR=/data

ENTRYPOINT [ "sermas-cli" ]
