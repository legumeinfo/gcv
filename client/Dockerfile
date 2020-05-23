FROM node:14.3.0-alpine3.11

RUN npm install -g @angular/cli

WORKDIR /app

COPY . .

RUN apk add --no-cache git \
  && npm install \
  && apk del git

ENV PYTHONUNBUFFERED=1
USER daemon

ENTRYPOINT ["ng", "serve", "--host", "0.0.0.0"]

EXPOSE 4200
