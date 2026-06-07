# Build stage
FROM node:22-alpine AS builder

# Habilita o pnpm
RUN corepack enable && corepack prepare pnpm@8.15.8 --activate

# Define diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência e configuração
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma/
COPY data ./data/

# Instala dependências do build e remove o store do pnpm para reduzir uso de disco em camadas
RUN pnpm install --no-frozen-lockfile \
	&& pnpm store prune \
	&& rm -rf /root/.local/share/pnpm/store /root/.pnpm-store

# Gera o client do Prisma antes do build para garantir tipos disponíveis no TypeScript
RUN pnpm prisma generate

# Copia o código-fonte
COPY . .

# Faz o build da aplicação NestJS
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@8.15.8 --activate

WORKDIR /app

# Copia pacotes para produção e a configuração do Prisma 7
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma/
COPY data ./data/

# Instala apenas dependências de produção e remove o store para reduzir uso de disco
RUN pnpm install --prod --no-frozen-lockfile \
	&& pnpm store prune \
	&& rm -rf /root/.local/share/pnpm/store /root/.pnpm-store

# Copia os arquivos transpilados do estágio de build
COPY --from=builder /app/dist ./dist

# Garante que o Prisma tenha os binários necessários gerados para produção
RUN pnpm prisma generate

# Define ambiente de produção
ENV NODE_ENV=production

# A porta padrão do NestJS (pode ser sobrescrita via docker-compose)
EXPOSE 3333

# O script de início real será passado pelo docker-compose para rodar as migrations antes
CMD ["pnpm", "run", "start:prod"]