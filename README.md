## Guia para rodar o projeto com Docker

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
```

### Passo 3: Preencha um arquivo .env.docker de acordo com o .env.example

### Passo 4: Rode o comando de deploy do docker

```bash
$ npm run docker:deploy
```

## Guia para ativar o backup diário
