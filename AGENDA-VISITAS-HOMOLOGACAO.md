# Agenda diária e visitas avulsas — homologação

Implementação em `codex/agenda-visitas-homologacao`, baseada em
`homologacao` (`e95f45377edf83e52194360249a5e195def4d32c`).
Frontend coordenado: DevSELLOU/FrontAntigo, branch de mesmo nome,
base `18db86e0382a903db63a0cf66d4610ea7c92920c`.

## Arquitetura encontrada

- O sino em Topbar era um botão sem ação, com indicador fixo. O cabeçalho mobile não tinha sino.
- Route representa o planejamento; Trip representa sua execução; VisitRecord registra visitas realizadas.
- ScheduledVisit já representa o agendamento, com cliente, usuário, empresa, DATEONLY, status, notas e origem opcional em viagem/registro. Era criado nos fluxos de reagendamento, sem endpoint público de criação avulsa e sem horário.
- Rotas carregava rotas e histórico combinado. Agendamentos sem rota eram tratados como clientes não visitados.
- Clientes e produtos são consultados por empresa. O seed de homologação cria também vínculos de vendedor, pagamentos, categoria, estoque e tabela de preços.
- O endpoint de usuários da empresa retorna UserCompany com user aninhado; a action usada pelos formulários esperava usuários planos. A normalização agora usa userId, nome do user e papel/status do vínculo, sem repassar outros campos.
- O controller de Rotas não aplicava CompanyOwnershipGuard. Agora utiliza a proteção existente; o acesso global de ADMINISTRATOR permanece conforme a regra atual do projeto.

## Contrato

- POST /company/:companyId/routes-visits/scheduled-visits: customerId, userId, scheduledDate (YYYY-MM-DD), scheduledTime (HH:mm), notes opcional. Cria PENDING sem rota/viagem.
- Cliente e responsável precisam pertencer à empresa. O responsável precisa ter usuário e vínculo ativos e papel comercial permitido.
- GET /company/:companyId/routes-visits/scheduled-visits/my/day?date=YYYY-MM-DD: usa exclusivamente o ID autenticado, empresa, data exata e status PENDING; ordena por horário/ID.
- A data vem do calendário local do navegador, sem conversão para UTC. Não é aceito userId para escolher a agenda de outra pessoa.
- scheduledTime é TIME nullable na tabela existente. Agendamentos antigos exibem “Sem horário”.

## Seed e aplicação em homologação

As identidades adicionais são cliente-002 até cliente-011 no domínio fictício
sellou-homologacao.example e DEV-PROD-002 até DEV-PROD-011.
São dez clientes e dez produtos além dos originais. Os vínculos necessários aos
formulários são incluídos. O seed mantém transação, lock, verificações de identidade
do banco/usuário, TLS e recusa de sobrescrita de registros divergentes.

Após revisão dos PRs, aplicar primeiro o backend em homologação, depois o frontend.
O provider atual já executa sequelize.sync({ alter: true }); ele adiciona a coluna
nullable. Não foi introduzido outro mecanismo de migração.
Executar npm run seed:homologacao apenas no ambiente dedicado, com a configuração
de homologação já documentada em RENDER-HOMOLOGACAO.md. Não habilitar reset de senhas.

Nenhum merge, deploy ou comando de banco remoto foi executado neste trabalho.
Produção não foi alterada. Não há merge automático.

## Validação em 16/10/2026

Backend: npm run build; npm test -- --runInBand (22 suites, 205 testes);
npx tsc --noEmit. Inclui criação sem rota, escopo de cliente/responsável, filtros
da agenda, DTOs inválidos, identidade autenticada, proteção de empresa e papéis.

Frontend: npm test com TZ=America/Sao_Paulo (19 arquivos, 136 testes);
npx tsc --noEmit; npm run build. Build concluído, com avisos de lint do projeto.
Testes novos cobrem data local e a distinção entre ID do vínculo e do usuário.

Seed executado duas vezes em PostgreSQL 16 isolado, em localhost:55432, com TLS
e identidade sellou_homologacao: primeira execução criou 11 clientes e 11 produtos
(original + 10); segunda execução retornou created: {}.

Chromium real, fuso America/Sao_Paulo, desktop 1440×1000 e mobile 390×844:

- Estado inicial sem visitas: “Não há compromissos hoje.”
- Quatro visitas criadas pelo formulário: 16/10 às 09:00 e 14:30; 17/10 às 10:00 e 16:00.
- Agenda em Rotas e histórico exibiram as visitas avulsas.
- Sino exibiu somente as duas visitas do dia 16, com horário, cliente e identificação.
- Os dez novos clientes foram conferidos no seletor da visita e os dez produtos no seletor de Novo pedido.
- Vendedor fictício adicional com userId 2 e vínculo 99 confirmou a normalização do seletor. Uma visita adicional via API confirmou o isolamento: a agenda do administrador continuou com duas, a do vendedor com uma.
- API real retornou 403 para empresa alheia e 400 para vínculo ausente, cliente inválido, data impossível e horário inválido; consulta a dia vazio retornou lista vazia.

## Arquivos alterados

Backend:

- src/routes-visits/entities/scheduled-visit.entity.ts
- src/routes-visits/dtos/scheduled-visit.dto.ts
- src/routes-visits/scheduled-visit.service.ts
- src/routes-visits/routes-visits.controller.ts
- scripts/seed-homologacao.cjs
- tests/routes-visits/scheduled-visit.service.spec.ts
- tests/routes-visits/scheduled-visit.dto.spec.ts
- tests/routes-visits/daily-agenda-access.spec.ts
- AGENDA-VISITAS-HOMOLOGACAO.md

O inventário do frontend está em seu AGENDA-VISITAS-HOMOLOGACAO.md.

## Limitações

As validações e os dados de teste são locais e isolados; não foram aplicados ao
Render nem ao banco remoto de homologação. Os PRs precisam ser revisados e
aplicados de forma coordenada para disponibilizar a funcionalidade nesse ambiente.
A agenda do sino considera ScheduledVisit pendente; Route continua sendo planejamento
de rota, sem gerar registros paralelos. O horário usa a mesma data local de DATEONLY,
sem converter compromissos entre fusos. Não foi criada central genérica de notificações.
