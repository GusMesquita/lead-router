# Imagem de produção do dashboard. O contexto de build é a raiz do repositório
# (`docker build -f web/Dockerfile .`) para o build conferir o Node contra o
# .nvmrc; o que entra no contexto está em web/Dockerfile.dockerignore.

# Mesma versão de .nvmrc — o estágio `deps` falha se as duas divergirem.
ARG NODE_VERSION=24.21.0

FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /web
# O pnpm vem do `packageManager` de package.json, via corepack: nenhuma versão
# fixada aqui.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY .nvmrc /tmp/.nvmrc
RUN test "v$(cat /tmp/.nvmrc)" = "$(node --version)" \
    || { echo "NODE_VERSION diverge de .nvmrc" >&2; exit 1; }
# Só os manifestos: a camada de dependências sobrevive a mudanças no código.
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
# Sem LEAD_ROUTER_*: `/` é dinâmico, o build não chama a API e nenhuma chave
# entra na imagem. Elas chegam em runtime, pelo compose.
RUN pnpm build

FROM node:${NODE_VERSION}-slim AS runtime
WORKDIR /web
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# Standalone: server.js e só as dependências rastreadas pelo build. public/ e
# .next/static não vêm junto por padrão; o server.js os serve se copiados.
COPY --from=build --chown=node:node /web/.next/standalone ./
COPY --from=build --chown=node:node /web/.next/static ./.next/static
COPY --from=build --chown=node:node /web/public ./public
# A imagem oficial já traz o usuário sem privilégio `node`.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
