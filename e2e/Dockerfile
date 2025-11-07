# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine

# Usar NODE_ENV de testes.
ENV NODE_ENV testing


WORKDIR /usr/src/app

# Instalar dependências de desenvolvimento para a build (necessário pelo tsc)
# Armazena as dependências em cache para otimizar processos fututos de build.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
		--mount=type=cache,target=/root/.npm \
    npm ci

# Rodar os testes sem acesso root.
USER node

# Copiar o código fonte para dentro da imagem.
COPY . .

# Expor a porta em que a aplicação ficará disponível.
EXPOSE 1000

# Rodar a build.
RUN npm run build

# Rodar os testes.
CMD npm run test
