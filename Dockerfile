FROM node:8.9.4-slim

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

RUN apt-get update && apt-get upgrade -y && apt-get install git -y

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY packages/ ./packages

COPY lerna.json .eslintrc .eslintignore ./

RUN npx lerna bootstrap
