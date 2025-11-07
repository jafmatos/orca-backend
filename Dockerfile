# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.14.0

################################################################################
# Usa a imagem do node para todos os estágios
FROM node:${NODE_VERSION}-alpine as base

# Define o diretório de trabalho para todos os estágios da build.
WORKDIR /usr/src/app

################################################################################
# Criar estágio para instalar dependências de produção.
FROM base as deps

# Torna os aqruivos package.json e package-lock.json do host acessíveis para o container para evitar copiá-los para dentro do container e ocupar espaço permanentemente.
# Armazena as dependências em cache para otimizar processos futuros de build.
RUN --mount=type=bind,source=package.json,target=package.json \
	--mount=type=bind,source=package-lock.json,target=package-lock.json \
	--mount=type=cache,target=/root/.npm \
	npm ci --omit=dev

################################################################################
# Criar estágio para fazer build da aplicação.
FROM deps as build

# Instalar dependências de desenvolvimento para a build (necessário pelo tsc)
# Armazena as dependências em cache para otimizar processos fututos de build.
RUN --mount=type=bind,source=package.json,target=package.json \
	--mount=type=bind,source=package-lock.json,target=package-lock.json \
	--mount=type=cache,target=/root/.npm \
	npm ci

# Copiar o código fonte para dentro da imagem.
COPY . .

# Rodar o comando de build.
RUN npm run build

################################################################################
# Criar um novo estágio para rodar a aplicação com as dependências mínimas.
FROM base as final

# Usar NODE_ENV de produção.
ENV NODE_ENV production

# Criar pasta de uploads no container e garantir permissões de acesso a ela.
RUN mkdir -p uploads && \
    chown -R node:node uploads && \
    chmod -R 755 uploads

# Rodar a aplicação sem acesso root.
USER node

# Copiar package.json para poder utilizar os scripts definidos no arquivo.
COPY package.json .

# Copiar as dependências de produção do estágio deps para a imagem
# Copiar a build do estágio build para a imagem.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Expor a porta em que a aplicação ficará disponível.
EXPOSE 3333

# Rodar a aplicação.
CMD npm run start:prod
