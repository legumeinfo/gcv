FROM node:14.3.0-alpine3.11 AS dev

# ensure "ng" in PATH
RUN npm install -g @angular/cli@8.3.19

# optimization to reinstall packages only if package.json changed
COPY package.json .

RUN apk add --no-cache git \
  && npm install \
  && npm link \
  && apk del git

WORKDIR /client
COPY . .
RUN ln -s /node_modules .

VOLUME ["/client/src"]

ENTRYPOINT ["ng", "serve", "--host", "0.0.0.0"]

EXPOSE 4200

FROM dev AS builder

COPY . /client
RUN sed -i'' 's#http://localhost:8000##' src/config/config.json
RUN  && ng build --prod --build-optimizer

FROM nginx:1.17-alpine AS prod

COPY nginx/default.conf /etc/nginx/conf.d/
COPY --from=builder /client/dist /usr/share/nginx/html

