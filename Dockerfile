FROM node:14.18.1-alpine AS dev

WORKDIR /client

# install dependencies
COPY package.json .
COPY package-lock.json .
COPY scripts/ scripts/
COPY dep/ dep/

RUN npm ci

COPY . .

ENTRYPOINT ["npx", "ng", "serve", "--host", "0.0.0.0"]

EXPOSE 4200

FROM dev AS builder

COPY . /client
ARG GCV_SUB_URI='/'
RUN sed -i'' "s#http://localhost[:0-9]*/#${GCV_SUB_URI}#" src/config/config.json
RUN ng build --base-href "${GCV_SUB_URI}" --prod --build-optimizer

FROM nginx:1.20.1-alpine AS prod

COPY nginx/default.conf /etc/nginx/conf.d/
ARG GCV_SUB_URI='/'
RUN sed -i'' -e "s#location */#location ${GCV_SUB_URI}#" /etc/nginx/conf.d/default.conf
COPY --from=builder /client/dist /usr/share/nginx/html

