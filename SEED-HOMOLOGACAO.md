# Base fictícia da Sellou — somente homologação

`npm run seed:homologacao` amplia o seed anterior em uma transação, sem alterar entidades, permissões ou cálculos de negócio. Empresa: **Sellou Homologação**, CNPJ deliberadamente fictício `00000000000000`. E-mails usam o domínio reservado `.example`; nomes, endereços, telefones e documentos são fictícios. Nenhum e-mail, boleto, PIX, upload ou integração externa é acionado.

## Credenciais de teste

Todos os seis usuários usam a senha de teste definida no segredo **`HOMOLOG_ADMIN_PASSWORD`**. O seed não imprime, grava em documentação ou redefine essa senha. Para repetir a execução, mantenha o mesmo segredo. Ela deve ter 12–72 bytes, letra maiúscula, minúscula, número e símbolo. Não reutilize senha de produção.

| Perfil | E-mail | Papel real | Cargo |
| --- | --- | --- | --- |
| Administrador | `admin@sellou-homologacao.example` | `ADMINISTRATOR` | Administrador de homologacao |
| Gerente | `gerente@sellou-homologacao.example` | `REGIONAL_MANAGER` | Gerente |
| Representante 1 | `representante1@sellou-homologacao.example` | `SALES_REP` | Representante Comercial |
| Representante 2 | `representante2@sellou-homologacao.example` | `SALES_REP` | Representante Comercial |
| Vendedor Interno 1 | `interno1@sellou-homologacao.example` | `SALES_REP` | Vendedor Interno |
| Vendedor Interno 2 | `interno2@sellou-homologacao.example` | `SALES_REP` | Vendedor Interno |

O sistema não possui papel específico de vendedor interno. Os quatro vendedores têm o papel comercial existente, carteiras vinculadas e o gerente como superior em `UserHierarchies`. Todos os usuários e vínculos `UserCompanies` ficam ativos. O acesso à administração de usuários continua restrito ao administrador.

## Conexão e execução

| Variável | Valor exigido |
| --- | --- |
| `APP_ENV` | `homologacao` |
| `NODE_ENV` | `production` (modo otimizado do Node/Nest, sem relação com o banco de produção) |
| `DB_DATABASE`, `DB_USERNAME` | `sellou_homologacao` |
| `DB_HOST` | hostname do recurso `dpg-db4ko6vavr4c73fkjdag-a` informado pelo painel do Render |
| `DB_PORT` | `5432` |
| `DB_PASSWORD` | segredo exclusivo do PostgreSQL de homologação |
| `DB_TLS` | `true` |
| `DB_TLS_REJECT_UNAUTHORIZED` | `true` para conexão externa; `false` somente no host interno autoassinado |
| `HOMOLOG_ADMIN_PASSWORD` | segredo com a senha fictícia dos seis usuários |

O host externo deve ser copiado do painel, não deduzido do host interno. O Codex Cloud precisa de acesso TCP 5432 ao hostname externo e HTTPS a `backantigo.onrender.com` e `frontantigo.onrender.com`. O host interno funciona somente na rede privada do Render. O seed rejeita outro recurso, porta, banco ou usuário, TLS desativado e validação de certificado desativada no host externo. Também verifica `current_database()` e `current_user` dentro da transação antes de escrever.

Depois do build do backend e com o schema já inicializado pelo sistema:

```bash
npm run seed:homologacao
npm run seed:homologacao
npm run validate:homologacao
```

No Render, `SEED_HOMOLOGACAO=true` no startup continua executando esse mesmo script após a API ficar pronta. Não é necessário Shell pago. Após execução bem-sucedida e conferência do resumo nos logs, retorne `SEED_HOMOLOGACAO=false`. Não altere a senha de usuários já existentes para contornar uma falha.

## Contagens por tabela

O JSON de cada execução informa **`created`** (inseridos nesta execução), **`reused`** (já existentes), **`updated`** (registros distintos atualizados nesta execução) e **`seedTotal`** (registros desta base fictícia encontrados/criados). As contagens são publicadas somente após `COMMIT`. `seedTotal` não é o total global de registros da tabela. Registros criados podem também aparecer em `updated`, por exemplo o estoque após aprovação de um pedido.

Estes são os totais da base completa, confirmados em PostgreSQL 16 temporário com as entidades reais. Em banco vazio, `created` é igual a esta coluna. Ao ampliar v1, são reutilizados os registros anteriores; o resumo da execução é a fonte da quantidade efetivamente inserida. Na segunda execução sem mudanças, todas as tabelas informam `created=0` e `updated=0`.

| Tabela | Registros da base completa |
| --- | ---: |
| Companies | 1 |
| Cities | 13 |
| Users | 6 |
| UserCompanies | 6 |
| UserHierarchies | 4 |
| Categories | 3 |
| SubCategories | 6 |
| Segments | 3 |
| SubSegments | 6 |
| PaymentConditions | 3 |
| PaymentMethods | 3 |
| OrderSetups | 1 |
| Customers | 20 |
| CustomerPaymentConditions | 60 |
| CustomerPaymentMethods | 60 |
| customer_sellers | 41 |
| Products | 30 |
| StockMovements | 174 |
| ProductSubCategories | 30 |
| PriceTables | 1 |
| PriceTableItems | 30 |
| Orders | 109 |
| OrderItems | 217 |
| order_responsible_users | 109 |
| UserGoals | 100 |
| UserGoalProducts | 120 |

## Cenários e preservação dos dados

Data de referência fixa: **14/10/2026**. Não muda a cada execução, evitando que uma nova data duplique pedidos ou metas. Os 108 novos pedidos cobrem novembro/2025 a outubro/2026 e os nove status reais: `ON_BUDGET`, `IN_APPROVAL`, `APPROVED`, `INVOICED`, `DISPATCHED`, `DELIVERED`, `RETURNED`, `CANCELED` e `BLOCKED`. O orçamento v1 `DEV-ORC-001` é preservado, totalizando 109. Cada pedido possui itens, responsável, cliente e meios/condições válidos; os novos pedidos também têm gerente, histórico de transições e motivos quando aplicável.

Há uma tabela de preços com os 30 produtos, três categorias/seis subcategorias, três segmentos/seis subsegmentos, carteiras comerciais compartilhadas entre representantes e vendedores internos e metas mensais de valor e itens para os quatro vendedores. As metas de produtos de outubro abrangem os 30 produtos.

Treze pares de cidade/UF fictícios, com códigos inexistentes e coordenadas simuladas, alimentam os painéis de cobertura. Os clientes novos têm datas históricas e segmento textual correspondente ao vínculo de subsegmento, para filtros e relatórios legados. Nenhuma cidade real existente é alterada.

Estoque, movimentos, pagamentos parciais/integrais e crédito utilizado seguem os efeitos das transições existentes. O progresso de metas reproduz os incrementos atuais na aprovação, faturamento e devolução; não introduz uma nova forma de calcular as metas. Por isso o progresso de valor pode diferir da receita faturada. A consulta auxiliar de cobertura passa a retornar latitude e longitude já existentes em `Cities`: antes descartava essas colunas e respondia coordenadas nulas. Esse ajuste só corrige os dados retornados para o mapa.

São mantidos os IDs e a senha do administrador v1, o cliente, o produto e os vínculos anteriores. A única atualização de identidade é renomear a empresa v1 de `Sellou Homologacao Ficticia` para `Sellou Homologação`. Estoque, crédito e metas só recebem efeitos de pedidos inseridos na transação atual. O seed usa a mesma trava consultiva de v1, protegendo inclusive execuções simultâneas durante troca de deploy.

Dados divergentes, chaves ambíguas, empresa alheia ao seed, meta sobreposta, estoque insuficiente ou crédito excedido provocam rollback integral. Alterações feitas manualmente nos dados de teste podem exigir revisão antes de repetir o seed; ele não sobrescreve esses dados nem limpa tabelas.

## Validação reproduzível

`npm run test:seed:homologacao` testa o bloqueio de produção e a consistência dos cenários sem conexão. A suíte de integração é opcional e aceita **somente** um PostgreSQL temporário em `127.0.0.1:55432`, banco e usuário `sellou_homologacao`, definido em `HOMOLOG_TEST_DATABASE_URL`. Ela recusa destinos remotos, inicializa o schema pelas entidades reais e limpa apenas esse banco temporário. Nunca forneça a conexão Render para essa variável.

```bash
npm run build
# Configurar HOMOLOG_TEST_DATABASE_URL exclusivamente para o banco temporário local.
npm run test:seed:homologacao
```

`npm run validate:homologacao` autentica os seis usuários exclusivamente em `https://backantigo.onrender.com` e verifica 96 respostas de carteiras, produtos, pedidos, condições/meios de pagamento, prazo, categorias, dashboard/cobertura, metas e relatórios. Confere papel/empresa e exige 403 na administração de usuários para os perfis sem essa permissão. Não registra JWTs nem senhas. Essa verificação de API deve ser complementada por navegador em `https://frontantigo.onrender.com`: login, dashboard, clientes, produtos, pedidos/Novo Pedido, relatórios, configurações do administrador e logout.

**Situação da execução:** implementação e testes locais preparados; a execução no PostgreSQL do Render e a validação pública dependem do hostname externo, segredos e liberações de rede do ambiente. Resultados locais não comprovam execução ou login no Render.

### Resultados locais em 14/10/2026

- Backend compilado; nove testes do seed/integridade e seis testes de TLS aprovados.
- PostgreSQL 16 temporário com as entidades reais: **1.156 registros em 26 tabelas**. Segunda execução: zero registros criados e zero atualizados. Upgrade v1, transações concorrentes, rollback integral, senha divergente, banco incorreto e metas sobrepostas verificados.
- API local com TLS no PostgreSQL: seis logins e **96 checks** aprovados, incluindo papéis, vínculos, 403 administrativos esperados e coordenadas de cobertura.
- Chromium: **55 verificações de telas** aprovadas, sem erros de execução JavaScript. Login/logout dos seis usuários; dashboard, clientes, produtos, pedidos/Novo Pedido, relatórios de pedidos/produtos/vendas, metas, tabela de preços, cobertura e configurações administrativas conforme o perfil. Sem pedidos enviados pelo formulário ou integrações externas.
- Observação existente preservada: o card “Pedidos” usa a soma monetária de `invoices` e a formata como número. Esse comportamento não foi alterado pelo seed; não representa a contagem de 109 pedidos. Os contadores do seed são independentes dessa apresentação.
