FROM node:12-alpine
RUN mkdir -p /server
WORKDIR /server
RUN apk add python alpine-sdk
COPY packages/server/package.json /server
RUN npm i --only=production
RUN npm i typescript -D
COPY packages/server /server
RUN npm run build
EXPOSE 8080
CMD [ "npm", "start" ]