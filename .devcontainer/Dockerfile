# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.14.0

################################################################################
# Usa imagem Debian (bookworm-slim) em vez de Alpine.
# O VS Code Server requer glibc; Alpine usa musl libc e é incompatível.
FROM node:${NODE_VERSION}-bookworm-slim AS base

# Define o diretório de trabalho para todos os estágios da build.
WORKDIR /workspace

################################################################################
# Criar estágio para instalar dependências de desenvolvimento.
FROM base AS deps

# Armazena as dependências em cache para otimizar processos futuros de build.
RUN --mount=type=bind,source=package.json,target=package.json \
	--mount=type=bind,source=package-lock.json,target=package-lock.json \
	--mount=type=cache,target=/root/.npm \
	npm ci

################################################################################
# Imagem final do dev container.
FROM base AS final

# Usar NODE_ENV de desenvolvimento.
ENV NODE_ENV development

# Instalar dependências necessárias para o VS Code Server e ferramentas de dev.
RUN apt-get update && apt-get install -y --no-install-recommends \
	bash \
	curl \
	git \
	procps \
	&& rm -rf /var/lib/apt/lists/*

# Criar pasta de uploads no container e garantir permissões de acesso a ela.
RUN mkdir -p uploads && \
	chown -R node:node uploads && \
	chmod -R 755 uploads

# Copiar código fonte para o container.
COPY . .

# Copiar as dependências para o container.
COPY --from=deps /workspace/node_modules ./node_modules

# Expor a porta da API.
EXPOSE 3333

# Rodar a aplicação sem acesso root.
USER node
