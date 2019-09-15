FROM node:8.15-stretch

WORKDIR /usr/agent/

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install build-essential

COPY package*.json ./

RUN npm install --no-audit

COPY . ./

CMD [ "node", "src/index.js" ]
