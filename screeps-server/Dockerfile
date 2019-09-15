FROM node:8.11.1-stretch

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y build-essential

WORKDIR /screeps

COPY package*.json ./
RUN npm install

ENV ASSET_DIR=/screeps/assets
ENV DB_PATH=/screeps/db.json
ENV MODFILE=/screeps/mods.json

ENV CLI_HOST=0.0.0.0
ENV CLI_PORT=21026

ENV DRIVER_MODULE="@screeps/driver"

ENV GAME_HOST=0.0.0.0
ENV GAME_PORT=21025

ENV STORAGE_HOST=localhost
ENV STORAGE_PORT=21027

EXPOSE 21025
EXPOSE 21026

CMD ["npx", "screeps", "start"]
