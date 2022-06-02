FROM node:15-alpine as build
WORKDIR /app
COPY . .
#RUN npm install -g cordova ionic && cordova telemetry off
RUN npm install
RUN npm run build

FROM nginx:alpine
#RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/www/ /usr/share/nginx/html/
