FROM node:14-alpine

RUN mkdir -p /server
WORKDIR /server

RUN apk add python alpine-sdk jq

COPY packages/server/package.json packages/server/yarn.lock /server/
RUN yarn --frozen-lockfile

COPY packages/server /server
RUN yarn build
RUN jq 'del(.devDependencies)' package.json > tmp.json && mv tmp.json package.json
RUN yarn --frozen-lockfile

RUN apk del python alpine-sdk jq

EXPOSE 8080
CMD [ "yarn", "start" ]
