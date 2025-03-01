FROM node:16-alpine as build
WORKDIR /app
COPY . .
COPY config.xml config.xml
RUN rm -rf /app/www/
RUN npm install -g cordova ionic && cordova telemetry off
RUN npm install
RUN npm run build-prod

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/www/ /usr/share/nginx/html/
