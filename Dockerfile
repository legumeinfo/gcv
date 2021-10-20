FROM alpine:3.14 AS dev

RUN apk add --no-cache \
  git \
  libc6-compat \
  npm

WORKDIR /client

# install dependencies
COPY package.json .
COPY package-lock.json .
COPY scripts/ scripts/
COPY dep/ dep/

RUN npm ci

ENTRYPOINT ["npx", "ng", "serve", "--host", "0.0.0.0"]

EXPOSE 4200

FROM dev AS builder

COPY . .
ARG CLIENT_SUB_URI='/'
ARG MICROSERVICES_BASE_URL='http://localhost/gcv/'
RUN sed -i'' "s#http://localhost/gcv/#${MICROSERVICES_BASE_URL}#" src/config/config.json
RUN npx ng build --base-href "${CLIENT_SUB_URI}" --build-optimizer

FROM nginx:1.20.1-alpine AS prod

COPY --from=builder /client/dist /usr/share/nginx/html
