# Sellou — homologação no Render

## Escopo e análise

Dois Web Services e um PostgreSQL novos, exclusivos de homologação. Não reaproveitar serviços, banco, variáveis, arquivos dotenv, buckets ou segredos de produção. Desenvolvimento continua no Codex Cloud; push na branch `homologacao` dispara o deploy. Não há merge automático na `main` nem necessidade de GitHub Actions.

| Componente | Repositório | Branch | Root Directory | Build | Start |
| --- | --- | --- | --- | --- | --- |
| Frontend Next.js 14 | `DevSELLOU/FrontAntigo` | `homologacao` | vazio (raiz) | `npm ci && npm run build:homologacao` | `npm start -- --hostname 0.0.0.0 --port "$PORT"` |
| Backend NestJS | `DevSELLOU/BackAntigo` | `homologacao` | vazio (raiz) | Docker: `npm ci`, `npm run build`, `npm prune --omit=dev` | Docker CMD: `node scripts/start-homologacao.cjs`, que inicia `node dist/src/main.js` |

Frontend local: 3001; backend local: 3000; PostgreSQL: 5432. No Render cada Web Service usa seu próprio `PORT` (normalmente 10000), fornecido pela plataforma, e HTTPS externo em 443. Não publicar 3000/3001 manualmente. PostgreSQL é acessado pelo backend; nunca pelo navegador.

Incompatibilidades corrigidas: provider PostgreSQL tinha TLS desativado; Puppeteer em modo production exige `/usr/bin/chromium`; Dockerfile legado do frontend copiava `.env.production`. A homologação usa novo Dockerfile somente no backend e runtime Node nativo no frontend. CORS já permite apenas `FRONTEND_URL` em NODE_ENV=production e não exige mudança. `NEXT_PUBLIC_API_URL` também determina a CSP e precisa existir durante o build.

`NODE_ENV=production` é o modo otimizado do framework, não o ambiente de dados. A separação é `APP_ENV=homologacao`, banco e usuário `sellou_homologacao`, segredos novos e URLs novas. Backend e seed recusam homologação sem esses nomes e TLS. Nomes não substituem conferir o recurso correto no painel.

## 1. Publicar as branches

As branches locais `homologacao` foram preparadas. Confirme os arquivos e publique apenas essas branches, após revisar o diff e excluir qualquer segredo:

```bash
cd /workspace/BackAntigo
git switch homologacao
git status
git diff
# Fazer commit dos arquivos de homologação revisados, caso ainda não estejam commitados.
git push -u origin homologacao

cd /workspace/FrontAntigo
git switch homologacao
git status
git diff
# Fazer commit dos arquivos revisados; preservar as correções anteriores já autorizadas.
git push -u origin homologacao
```

Não adicionar `.env`, `.env.local` ou `.env.production`. Os `.env.homologacao.example` são modelos com placeholders, não arquivos para importar automaticamente. Não incluir ferramentas temporárias de túnel/preview que não fazem parte desta implantação.

## 2. Criar PostgreSQL exclusivo

Render → New → PostgreSQL:

- Name: `sellou-postgres-homologacao`.
- Database: `sellou_homologacao`; User: `sellou_homologacao` (preencher ambos explicitamente).
- PostgreSQL 16, se disponível; região igual à do backend.
- Selecionar **Free**. Se o painel não oferecer Free, parar; não escolher plano pago sem autorização.
- Criar o banco vazio. Não restaurar dump de produção.
- Copiar do novo recurso Internal Hostname, Port, Database, Username e Password para as variáveis do backend.
- Em Networking/External access, remover a regra pública `0.0.0.0/0` e deixar acesso externo desabilitado. O backend usa conexão interna.

O plano gratuito de PostgreSQL expira em 30 dias e não serve como armazenamento permanente. Renovação/migração ou plano pago exige decisão posterior. Não aceitar cobrança automática para resolver essa limitação.

TLS interno Render usa certificado autoassinado: `DB_TLS=true`, `DB_TLS_REJECT_UNAUTHORIZED=false` **somente com o hostname interno deste banco**, mantendo a rede privada. Não definir `NODE_TLS_REJECT_UNAUTHORIZED=0`. Se optar por hostname externo, usar `DB_TLS_REJECT_UNAUTHORIZED=true`; TLS externo é obrigatório. `DB_TLS_CA` permite uma CA específica quando necessário e disponível.

O bootstrap existente cria/altera tabelas com `sequelize.sync({alter:true})`, instala `unaccent` e cria índices. Esse comportamento foi preservado e deve apontar exclusivamente para o banco vazio de homologação. O usuário precisa poder criar tabelas/extensão/índices; verificar os logs do primeiro deploy.

## 3. Criar backend

Render → New → Web Service → conectar GitHub → `DevSELLOU/BackAntigo`:

- Name sugerido: `sellou-backend-homologacao` (nomes/URLs dependem da disponibilidade).
- Branch: `homologacao`; Root Directory: vazio.
- Runtime/Language: Docker.
- Dockerfile Path: `./Dockerfile.homologacao`; Docker Build Context: `.`.
- Docker Command: vazio, para usar CMD da imagem. Build/Start de Node não são campos usados pelo runtime Docker; os comandos estão na tabela acima.
- Instance Type: Free. Região do PostgreSQL.
- Health Check Path: `/api-json`.
- Auto-Deploy: ligado, a cada commit na branch selecionada.

Environment (não importar dotenv nem copiar credenciais existentes):

| Variável | Valor |
| --- | --- |
| `APP_ENV` | `homologacao` |
| `NODE_ENV` | `production` |
| `PORT` | fornecido pelo Render; não é necessário sobrescrever |
| `DB_HOST` | Internal Hostname do novo PostgreSQL |
| `DB_PORT` | `5432` ou port informada pelo recurso |
| `DB_DATABASE` | `sellou_homologacao` |
| `DB_USERNAME` | `sellou_homologacao` |
| `DB_PASSWORD` | senha gerada pelo novo recurso de homologação |
| `DB_TLS` | `true` |
| `DB_TLS_REJECT_UNAUTHORIZED` | `false`, somente para host interno Render autoassinado |
| `JWT_SECRET` | Generate no painel: segredo novo, exclusivo de homologação |
| `JWT_EXPIRES_IN` | `1h` |
| `FRONTEND_URL` | URL HTTPS exata do frontend, sem barra final |
| `SEED_HOMOLOGACAO` | `true` somente no primeiro deploy, depois `false` |
| `HOMOLOG_ADMIN_PASSWORD` | senha fictícia escolhida para o seed, mínimo 12 caracteres |

O frontend ainda pode não existir. Preencher inicialmente a URL planejada e, depois da criação do frontend, atualizar `FRONTEND_URL` com sua URL real e redeployar. Não usar `*` em CORS. A imagem instala Chromium e fontes e executa como usuário `node`; as opções Puppeteer existentes são preservadas.

## 4. Criar frontend

Render → New → Web Service → `DevSELLOU/FrontAntigo`:

- Name sugerido: `sellou-frontend-homologacao`.
- Branch: `homologacao`; Root Directory: vazio.
- Runtime/Language: Node, **não Docker**.
- Build Command: `npm ci && npm run build:homologacao`.
- Start Command: `npm start -- --hostname 0.0.0.0 --port "$PORT"`.
- Instance Type: Free; Auto-Deploy ligado a cada commit.
- Health Check Path: `/sign-in`.

| Variável | Valor |
| --- | --- |
| `NODE_VERSION` | `22.17.1` |
| `APP_ENV` | `homologacao` |
| `NEXT_PUBLIC_API_URL` | URL HTTPS real do novo backend, sem barra final e sem `/api` |
| `INTERNAL_API_URL` | mesma URL HTTPS do backend; não usar localhost |
| `NEXTAUTH_URL` | URL HTTPS real deste frontend, sem barra final |
| `NEXTAUTH_SECRET` | Generate: novo segredo exclusivo deste frontend |

A API não tem prefixo global `/api`; `/api/auth/*` no frontend é o NextAuth. `NEXT_PUBLIC_API_URL` entra no bundle e na CSP durante o build: alterar esse valor exige rebuild, não apenas restart. O build dedicado recusa arquivos dotenv e exige URLs HTTPS `*.onrender.com`, para esta configuração inicial sem domínio customizado.

Depois que o painel mostrar a URL real do frontend, confirmar `NEXTAUTH_URL` e atualizar `FRONTEND_URL` no backend. CORS exige correspondência exata de origem (protocolo e hostname, sem caminho). Segredos de NextAuth/JWT não precisam ser iguais; devem ser novos e separados.

## 5. Seed fictício

O seed completo está documentado em [SEED-HOMOLOGACAO.md](SEED-HOMOLOGACAO.md), incluindo os seis usuários, senha definida por segredo, contagens por tabela e proteções contra produção. Amplia o seed anterior para 20 clientes, 30 produtos, 109 pedidos e 100 metas, mantendo relacionamentos e papéis reais.

O startup aguarda `/api-json` e executa `npm run seed:homologacao` quando `SEED_HOMOLOGACAO=true`. Confira o resumo JSON nos logs e depois retorne essa opção para `false`. A segunda execução sem mudanças deve informar zero registros criados e atualizados em todas as tabelas. `HOMOLOG_ADMIN_PASSWORD` é a senha fictícia dos seis usuários; deve permanecer igual ao repetir o seed. Não é redefinida nem exibida nos logs.

O host autorizado corresponde ao recurso de homologação `dpg-db4ko6vavr4c73fkjdag-a`. O hostname externo deve ser copiado do painel Render e exige certificado TLS validado. Não usar o host interno fora da rede privada do Render. O script recusa qualquer recurso, banco ou usuário diferente.

Após popular a homologação, `npm run validate:homologacao` verifica os seis logins e os endpoints usados pelas telas, incluindo respostas 403 esperadas para acessos administrativos restritos. Complemente essa validação no navegador do frontend de homologação.

## 6. Validar a implantação pública

Substituir os dois hostnames pelos reais:

```bash
curl -f https://sellou-backend-homologacao.onrender.com/api-json -o /dev/null
curl -I https://sellou-frontend-homologacao.onrender.com/sign-in
curl -i -X OPTIONS https://sellou-backend-homologacao.onrender.com/auth/login \
  -H 'Origin: https://sellou-frontend-homologacao.onrender.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Esperar API 200, frontend 200 e preflight com `Access-Control-Allow-Origin` exatamente igual à URL do frontend. Origem diferente não deve receber esse cabeçalho. Não expor access tokens em logs ou capturas.

Abrir a URL pública do frontend no navegador comum, fazer login com o administrador fictício e senha escolhida. Confirmar sessão em `/api/auth/session`, dashboard, clientes, produtos, pedidos/Novo Pedido e configurações/Usuários. Conferir nome/email do administrador e prazo 0–30 no novo pedido. Na aba Network verificar login sem 401/500, requisições autenticadas à URL do backend sem localhost e ausência de bloqueios CORS/CSP. Fazer logout e confirmar retorno ao login.

Para validar a partir do Codex Cloud, adicionar **os hostnames exatos reais** dos dois Web Services à allowlist HTTP do ambiente. São conexões HTTPS 443, sem túnel nem TCP 7844. O navegador pessoal acessa diretamente essas URLs.

## Limites e dependências pendentes

Free Web Services suspendem após inatividade (atualmente 15 minutos); a primeira abertura pode demorar e deve aquecer primeiro a API e depois o frontend. A cota de 750 horas gratuitas é compartilhada pelo workspace. Memória gratuita pode limitar PDFs e cargas altas; verificar logs antes de decidir por plano pago. O container com Chromium é maior que uma aplicação Node simples.

Uploads/fotos exigem bucket e chaves Wasabi exclusivos de homologação: `WASABI_ENDPOINT`, `WASABI_REGION`, `WASABI_BUCKET_NAME`, `WASABI_ACCESS_KEY_ID`, `WASABI_SECRET_ACCESS_KEY`. Email/recuperação/envios exigem SMTP de teste: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_EMAIL_FROM`. Essas integrações não são necessárias para login ou o seed; sem elas, esses recursos permanecem pendentes. Não usar serviços/credenciais reais nem produção.

Dependências antigas possuem alertas de segurança; não foi feito upgrade automático de aplicação neste trabalho. Os repositórios podem ser públicos: não commitar segredos. Este guia prepara a implantação; recursos, domínio público e validação final no Render dependem de criação/configuração manual no painel.

Referências oficiais: [Docker](https://render.com/docs/docker), [PostgreSQL e TLS](https://render.com/docs/postgresql-creating-connecting), [limites gratuitos](https://render.com/docs/free), [deploy automático de Node](https://render.com/docs/deploy-node-express-app).

## Validação realizada no Codex Cloud

Build NestJS aprovado; imagem Docker com Node 22.17.1 construída; Chromium iniciou e gerou PDF. Build Next.js aprovado em cópia isolada sem dotenv (Node 20.20.2 disponível no Codex); o runtime indicado no Render é Node 22.17.1. Seis testes de TLS e doze testes das correções anteriores passaram. Há avisos de lint preexistentes, sem bloqueio do build.

Em PostgreSQL temporário separado (porta 55432), certificado TLS de teste validado com CA explícita, schema e seed passaram. API de teste na porta 3200: login 201, CORS permite origem configurada e não libera origem alheia; segunda execução do seed não criou duplicatas. Frontend compilado na porta 3201: `/sign-in` 200, login NextAuth e sessão autenticada, dashboard e telas de clientes, produtos, pedidos/Novo Pedido e configurações responderam 200. Essa verificação foi por HTTP, não uma validação visual de browser nem um deploy público no Render.

## Arquivos desta preparação

BackAntigo: `database.providers.ts`, `src/env.validation.ts`, `src/utils/database-tls.ts`, `tests/database-tls.spec.ts`, `package.json`, `Dockerfile.homologacao`, `Dockerfile.homologacao.dockerignore`, `scripts/start-homologacao.cjs`, `scripts/seed-homologacao.cjs`, `.env.homologacao.example`, `RENDER-HOMOLOGACAO.md`.

FrontAntigo: `package.json`, `scripts/build-homologacao.cjs`, `.env.homologacao.example`, `RENDER-HOMOLOGACAO.md`.

As correções anteriores de usuários/prazos e a configuração anterior de URL interna da API foram preservadas. Não são novas mudanças de regra de negócio desta preparação. Arquivos temporários de túnel permanecem fora do commit de Render.
