### Build web files
FROM node:18 AS web-build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


### Build server files
FROM node:18 AS server-build

WORKDIR /app/server

COPY ["server/package.json", "server/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./server .

RUN npm run build


### Build final image
FROM node:18-alpine
USER root

ENV RUNNING_IN_DOCKER="true"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
WORKDIR /app/server

# Install Chromium
RUN apk update && \
    apk add --no-cache nss udev ttf-freefont chromium nginx && \
    rm -rf /var/cache/apk/* /tmp/*

COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN npm install --production

COPY ./assets/nginx.conf /etc/nginx/nginx.conf
COPY ./assets/entrypoint.sh .
RUN chmod 755 entrypoint.sh

COPY --from=web-build /app/web/dist /var/www/html
COPY --from=server-build /app/server/build ./build

EXPOSE 80

ENTRYPOINT ["./entrypoint.sh"]
