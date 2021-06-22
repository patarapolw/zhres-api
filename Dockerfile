FROM python:3.9

RUN mkdir -p /server
WORKDIR /server

RUN apt-get update
RUN apt-get install -y jq curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get install -y nodejs
RUN npm i -g yarn

COPY packages/server/package.json packages/server/yarn.lock /server/
RUN yarn --frozen-lockfile

COPY packages/server /server
RUN mkdir -p ./generated
RUN pip install -r ./requirements.txt
RUN PYTHONPATH=$(which python) yarn generate
RUN yarn build
RUN jq 'del(.devDependencies)' package.json > tmp.json && mv tmp.json package.json
RUN yarn --frozen-lockfile

RUN apt-get remove -y jq

EXPOSE 8080
CMD [ "yarn", "start" ]
