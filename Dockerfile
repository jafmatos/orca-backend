# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.14.0

################################################################################
FROM node:${NODE_VERSION}-alpine as base

WORKDIR /usr/src/app

################################################################################
FROM base as deps

RUN --mount=type=bind,source=package.json,target=package.json \
	--mount=type=bind,source=package-lock.json,target=package-lock.json \
	--mount=type=cache,target=/root/.npm \
	npm ci

################################################################################
FROM deps as build

RUN --mount=type=bind,source=package.json,target=package.json \
	--mount=type=bind,source=package-lock.json,target=package-lock.json \
	--mount=type=cache,target=/root/.npm \
	npm ci

COPY . .

RUN npm run build

################################################################################
FROM base as final

ENV NODE_ENV production

RUN mkdir -p uploads && \
	chown -R node:node uploads && \
	chmod -R 755 uploads

USER node

COPY package.json .

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3333

CMD ["npm", "run", "start:prod"]
