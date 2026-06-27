# Build stage
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.8 --activate

# O diretório de trabalho agora representa a raiz do monorepo
WORKDIR /app

# Copia configurações da raiz
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copia os pacotes locais (suas regras e dependências cruzadas)
COPY packages ./packages

# Copia todo o código da API
COPY apps/api ./apps/api

# Instala TODAS as dependências da raiz para baixo
RUN pnpm install --no-frozen-lockfile \
	&& pnpm store prune \
	&& rm -rf /root/.local/share/pnpm/store /root/.pnpm-store

# Gera o client do Prisma (acessando a pasta da API via filtro)
RUN pnpm --filter aetherium-api prisma generate

# Faz o build da aplicação NestJS
RUN pnpm --filter aetherium-api run build


# Production stage
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@8.15.8 --activate

WORKDIR /app

# Em produção, copiamos a estrutura base do Monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/
COPY apps/api/data ./apps/api/data/
COPY apps/api/prisma.config.ts ./apps/api/

# Instala apenas dependências de produção para salvar memória
RUN pnpm install --prod --no-frozen-lockfile \
	&& pnpm store prune \
	&& rm -rf /root/.local/share/pnpm/store /root/.pnpm-store

# Copia os arquivos transpilados do estágio anterior
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Garante que o Prisma tenha os binários de prod gerados
RUN pnpm --filter aetherium-api prisma generate

# Entra definitivamente na pasta da API para rodar o app
WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3333

# O script mágico do docker-compose vai rodar daqui de dentro
CMD ["pnpm", "run", "start:prod"]