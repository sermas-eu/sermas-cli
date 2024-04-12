FROM node:20 as build

WORKDIR /app

ADD ./package.json ./
ADD ./package-lock.json ./
RUN npm i

ADD ./src ./src
ADD ./tsconfig.json ./
RUN npm run build

FROM node:20 as cli

WORKDIR /cli

ADD ./package.json ./
ADD ./package-lock.json ./
RUN npm i --omit=dev

COPY --from=build /app/dist ./dist

RUN npm link .

ENTRYPOINT [ "sermas-cli" ]
