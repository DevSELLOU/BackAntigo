# Preservação da configuração manual da empresa no seed

## Problema e comportamento

O seed falhava com `Existing Companies.customColor differs; refusing overwrite`
quando a cor da empresa fictícia era ajustada manualmente. O helper comparava todos
os valores padrão de criação também em uma empresa já existente.

Agora os padrões da empresa são usados integralmente somente na inserção inicial.
Para uma empresa existente, somente `cnpj` e `corporateName` são comparados.
Nenhum campo da empresa é atualizado, incluindo os timestamps.

Os cinco campos que **deixaram de exigir igualdade** são:

| Campo | Política ao encontrar a empresa |
|---|---|
| customColor | Preservar exatamente o valor existente, sem comparar ou sobrescrever |
| fantasyName | Preservar o nome fantasia configurado manualmente |
| about | Preservar a descrição configurada manualmente |
| status | Preservar o status configurado manualmente |
| allowOrdersWithoutStock | Preservar a preferência operacional configurada |

Outros campos, como logoUrl, shopColor, coverUrl, whatsapp, phone, address e
businessHours, já não eram comparados pelo seed e continuam intocados.

## Validações mantidas

- APP_ENV=homologacao, NODE_ENV=production, banco/usuário sellou_homologacao e TLS.
- CNPJ fictício 00000000000000 e razão social Sellou Homologacao Ficticia.
- Qualquer empresa de outra identidade faz o seed abortar; a comparação SQL usa
  IS DISTINCT FROM para também rejeitar identidades nulas.
- Identidade fictícia duplicada é recusada.
- Demais tabelas mantêm a comparação rígida original, inclusive empresa do usuário,
  papel/status dos vínculos e relacionamentos do catálogo.
- Transação, advisory lock, rollback e proteção de senha permanecem.

As identidades dos dez clientes adicionais (cliente-002 até cliente-011) e dez
produtos (DEV-PROD-002 até DEV-PROD-011) não mudaram. Com a base original existente,
somente os itens ausentes e seus vínculos necessários são inseridos. Uma nova
execução reutiliza os registros e não os duplica. O bootstrap de uma base vazia
continua disponível com os mesmos padrões.

## Validação local

Executados npm run build, npm test -- --runInBand e npx tsc --noEmit.
O backend passou com 22 suites / 205 testes; build e TypeScript passaram.

O teste scripts/seed-homologacao.pg.test.cjs usa exclusivamente um PostgreSQL
descartável em 127.0.0.1:55438; não lê DB_* nem segredos remotos do executor.
Depois do build e da preparação desse banco local dedicado com TLS:

    RUN_HOMOLOG_SEED_PG_TESTS=1 node scripts/seed-homologacao.pg.test.cjs

Resultado: 11 testes aprovados, sem skips na execução de integração:

- padrões de inserção inicial preservados;
- empresa com os cinco campos manuais divergentes, além de logo/capa/contato,
  preservada integralmente, inclusive updatedAt;
- criação de exatamente dez clientes e dez produtos ausentes, sem recriar usuário,
  empresa ou orçamento existentes;
- segunda execução sem inserts e sem alteração de nenhuma linha;
- base parcial: inserção de apenas dois clientes e três produtos faltantes;
- recusa de CNPJ divergente, razão social divergente, empresa duplicada e vínculo
  com papel inconsistente;
- conflito posterior em PriceTableItems desfaz os clientes/produtos já inseridos;
- produção, banco/usuário errado e TLS desativado recusados antes de conectar.

Sem a variável de opt-in, o teste PostgreSQL é pulado; os guards continuam testados.

## Escopo de entrega

Branch codex/preservar-configuracao-empresa-seed baseada em homologacao.
Nenhuma alteração de frontend, main, produção, configuração/segredo do Render
ou execução do seed remoto. O PR deve ser revisado e aplicado em homologacao
antes de repetir o comando remoto npm run seed:homologacao.
