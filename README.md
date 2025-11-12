## Guia para rodar a aplicação

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [NodeJS](https://nodejs.org/)
- [Postgres](https://www.postgresql.org/)
- [Redis](https://redis.io/)

### Passo 1: Crie um banco de dados para a aplicação

### Passo 2: Preencha um arquivo .env de acordo com o .env.example

### Passo 3: Rode o comando de execução da aplicação

```bash
$ npm run start:dev
```

## Guia para rodar os testes

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Docker](https://www.docker.com/)

### Passo 1: Preencha um arquivo .env.jest de acordo com o .env.jest.example

### Passo 2: Rode o comando de execução da aplicação em modo de testes com Docker

```bash
$ npm run docker:test:up
```

### Passo 3: Rode o comando de execução dos testes

```bash
$ npm run test
```

## Guia para rodar o projeto em produção com Docker

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Docker](https://www.docker.com/)

### Passo 1: Clonar o repositório

```bash
$ git clone --depth=1 -b main https://github.com/chickelit/orca-backend .
```

### Passo 2: Crie os volumes

```bash
$ docker volume create backend_db
$ docker volume create backend_uploads
$ docker volume create redis_data
```

### Passo 3: Preencha um arquivo .env.docker de acordo com o .env.example

### Passo 4: Rode o comando de deploy do docker

```bash
$ npm run docker:deploy
```

## Guia para rodar os testes em integração contínua com Docker

### Passo 1: Preencha um arquivo .env.docker.test de acordo com o .env.docker.example

### Passo 2: Rode o comando de execução dos testes com Docker

```bash
$ npm run docker:test
```

## Guia para ativar o backup diário
