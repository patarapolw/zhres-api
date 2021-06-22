FROM node:14

RUN mkdir -p /server
WORKDIR /server

RUN apt-get update
RUN apt-get install -y jq python3

COPY packages/server/package.json packages/server/yarn.lock /server/
RUN yarn --frozen-lockfile

COPY packages/server /server
RUN PYTHONPATH=$(which python3) yarn generate
RUN yarn build
RUN jq 'del(.devDependencies)' package.json > tmp.json && mv tmp.json package.json
RUN yarn --frozen-lockfile

RUN apt-get remove -y jq

EXPOSE 8080
CMD [ "yarn", "start" ]
