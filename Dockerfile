# base stage installs the project dependencies
FROM node:18-alpine3.16 as base

# install non-npm build dependencies
RUN apk add --no-cache \
  # required by degit (dep/legumeinfo-microservices)
  git \
  # required by grpc-tools (dep/legumeinfo-microservices)
  libc6-compat

WORKDIR /gcv

# prepare to install npm dependencies
COPY package.json .
COPY package-lock.json .
COPY scripts/ ./scripts
COPY dep/ ./dep

# install npm build dependencies
# enable legacy SSL support: https://medium.com/the-node-js-collection/node-js-17-is-here-8dba1e14e382#5f07
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm ci

# copy the project
COPY . .


# dev stage runs the dev server
FROM base as dev

ENTRYPOINT ["npx", "ng", "serve", "--host", "0.0.0.0"]

EXPOSE 4200


# build stage builds the project for production
FROM base as build

# allow people building manually to pass arguments to angular
ARG ANGULAR_BUILD_OPTIONS=''

# build the project
RUN npx ng build --configuration production $ANGULAR_BUILD_OPTIONS


# prod stage deploys the project with NGINX
FROM nginx:1.23-alpine as prod

# copy the nginx configuration template
COPY nginx/templates/default.conf.template /etc/nginx/templates/
# set the default values for the variables used in the template
ENV GCV_PATH=/gcv

# put the build artifacts where nginx can find them
COPY --from=build /gcv/dist /usr/share/nginx/html

# the nginx image automatically runs nginx and exposes port 80
