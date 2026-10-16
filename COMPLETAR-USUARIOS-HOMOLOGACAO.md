# Completar usuários/vínculos de homologação sem redefinir senhas

## Causa encontrada no código e no GitHub

Na revisão desta ação, o PR #1 (`codex/seed-homologacao-completo`, commit `c1faca92efd753a452d686274626ae07c271a81c`) continua **aberto, sem merge**. A branch `homologacao` mantém o seed v1 (`scripts/seed-homologacao.cjs`, blob `11b5256fadaac82f31514c1015f7585b8f63fa4a`), que cria somente o administrador. Deploy da branch `homologacao` não inclui automaticamente a implementação do PR #1. Primeiro conferir no Render a branch e o commit efetivamente implantados, bem como o Docker Command usado. Não há acesso aos logs/histórico de deploy do Render nesta preparação.

Mesmo se o seed completo for executado a partir da branch do PR #1, ele compara a senha do administrador existente com `HOMOLOG_ADMIN_PASSWORD` e lança `Senha existente difere; nenhuma redefinicao realizada` se divergirem. O administrador é o primeiro usuário. O seed inteiro é transacional: essa falha (ou qualquer falha posterior) causa rollback dos novos registros e dos vínculos. Se `SEED_HOMOLOGACAO=false`, o startup nem executa o seed. Essas são causas comprováveis no código; a mensagem do diagnóstico `six_exist=false` sozinha não comprova qual execução ocorreu no Render.

Não fazer merge de PR #1 nem habilitar seu seed completo como solução automática neste passo: além de usuários, ele cria pedidos, produtos, crédito, estoque e metas, e a senha divergente ainda pode abortá-lo. Este complemento trata apenas os cadastros de usuários e seus vínculos que faltam. Não declara a carga comercial do PR #1 concluída.

## O que esta ação faz

`scripts/complete-homologacao-users.cjs` usa as mesmas seis identidades e papéis do PR #1:

| Email em `@sellou-homologacao.example` | Papel |
| --- | --- |
| `admin` | `ADMINISTRATOR` |
| `gerente` | `REGIONAL_MANAGER` |
| `representante1`, `representante2`, `interno1`, `interno2` | `SALES_REP` |

- Exige o host interno autorizado, banco e usuário `sellou_homologacao`, TLS, ambiente dedicado e flags de seed completo/reset desligadas.
- Exige exatamente uma empresa fictícia ativa, com CNPJ `00000000000000`, alias `sellou-homologacao` e nome `Sellou Homologação` ou `Sellou Homologacao Ficticia`. Não renomeia a empresa.
- Confere todos os usuários existentes e vínculos antes de inserir. Identidade, empresa, papel, status ou cargo divergentes, vínculo adicional e duplicidade causam rollback. Não corrige conflitos sobrescrevendo dados.
- Insere apenas usuários e vínculos ausentes. Para contas **novas**, usa o valor atual de `HOMOLOG_ADMIN_PASSWORD` com bcrypt custo 10; para contas existentes, não consulta, compara ou altera o hash. Não limpa tokens nem altera timestamps de registros existentes.
- Não executa `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, reset de senha, seed comercial ou bootstrap da aplicação. Não toca no marcador de reset. Não usa `ON CONFLICT DO NOTHING` para esconder conflitos.
- Usa transação, a mesma trava consultiva dos seeds/reset e locks breves nas três tabelas envolvidas para proteger a verificação contra alterações concorrentes. Espera por locks por até 10 segundos; queries por até 60 segundos.
- Valida os seis usuários, empresa e seis vínculos antes do commit. Depois faz a mesma verificação numa transação somente de leitura, exigindo zero inserções necessárias.

## Executar no Render

Disponibilizar os novos arquivos na branch de **homologação do backend**, preservando `main`. Não é necessário incorporar o PR #1 para executar este subconjunto. A imagem de `Dockerfile.homologacao` já copia o diretório `scripts`; fazer rebuild do commit que contém o complemento.

No Web Service **exclusivo de homologação**, configurar tudo antes do deploy, sem editar grupos de variáveis compartilhados com produção:

| Campo/variável | Valor |
| --- | --- |
| Branch | `homologacao` após merge desta ação; ou a branch revisada que contém os scripts |
| Docker Command | `node scripts/complete-homologacao-users.cjs` |
| `COMPLETE_HOMOLOG_USERS` | `true` |
| `SEED_HOMOLOGACAO` | `false` |
| `RESET_HOMOLOG_PASSWORDS_ONCE` | `false` |
| `APP_ENV` | `homologacao` |
| `NODE_ENV` | `production` |
| `DB_HOST` | `dpg-db4ko6vavr4c73fkjdag-a` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` e `DB_USERNAME` | `sellou_homologacao` |
| `DB_PASSWORD` | Manter o segredo do PostgreSQL de homologação |
| `DB_TLS` | `true` |
| `DB_TLS_REJECT_UNAUTHORIZED` | Manter `false` para esse hostname interno Render autoassinado |
| `HOMOLOG_ADMIN_PASSWORD` | Manter o segredo atual; 12 a 72 bytes, com maiúscula, minúscula, número e símbolo |

Executar **Manual Deploy → Deploy latest commit** e procurar as linhas `HOMOLOG_USERS_COMPLETION` nos logs. Se Shell já estiver disponível, o mesmo comando pode ser executado de forma pontual com as mesmas flags. Não colocar esse comando no build, não encadear o reset e não habilitar o seed antigo/completo.

O comando é pontual e não abre HTTP. Como Docker Command de Web Service, o Render pode marcar a tentativa como falha por término/health check e reiniciá-la. Isso é independente do resultado transacional: use as linhas abaixo para saber se houve commit. Reinícios repetem de forma idempotente, mas desative a ação assim que coletar a validação. Não é necessário contratar plano pago.

## Validar o resultado

Esperado se houver somente o administrador e seu vínculo:

```json
{"status":"committed","users_created":5,"users_reused":1,"memberships_created":5,"memberships_reused":1,"six_users_exist":true,"all_in_fictional_company":true,"six_memberships_correct":true}
{"status":"verified","users_created":0,"users_reused":6,"memberships_created":0,"memberships_reused":6,"six_users_exist":true,"all_in_fictional_company":true,"six_memberships_correct":true,"idempotent_no_inserts":true}
```

Se o vínculo do administrador também faltar, a primeira contagem de vínculos criados será 6. Se mais contas já existirem, as contagens criadas serão menores. Nunca inferir sucesso apenas de um deploy verde. `committed` confirma a transação; `verified` confirma a segunda passagem sem inserções. Se a segunda passagem falhar, os registros do primeiro commit continuam presentes; não apague nada. Corrija a causa identificada e repita a ação, que preserva os registros já criados.

Como confirmação independente, trocar o Docker Command para `node scripts/diagnose-homologacao-passwords.cjs`, definir `COMPLETE_HOMOLOG_USERS=false`, manter as outras duas flags `false` e executar novamente. Esperar `six_users.status=ok`, `six_exist=true`, `company_matches=true` e `user_companies.status=ok`. O marcador de reset deve permanecer no estado anterior; sua ausência não é erro deste complemento.

Após concluir: manter `COMPLETE_HOMOLOG_USERS=false`, `SEED_HOMOLOGACAO=false` e `RESET_HOMOLOG_PASSWORDS_ONCE=false`. Limpar o Docker Command restaura o CMD normal; o bootstrap normal existente usa `sequelize.sync({alter:true})`, portanto sua inicialização tem efeitos de schema próprios e não faz parte do comando pontual acima. Não executar reset de senha neste passo. Contas antigas continuam com suas senhas anteriores; esta ação não garante login delas com a variável atual.

## Validação local

Testes unitários: `node scripts/complete-homologacao-users.test.cjs`.

Integração opt-in: `RUN_HOMOLOG_USERS_PG_TESTS=1 node scripts/complete-homologacao-users.pg.test.cjs`. Usa exclusivamente PostgreSQL temporário em `127.0.0.1:55439` com credenciais fictícias fixas; não lê `DB_*` para conectar. O fixture recria somente as três tabelas no banco local de teste. Nunca executar esse fixture em outro destino.

PostgreSQL 16 local: criação dos cinco usuários/vínculos ausentes, preservação integral do administrador com senha divergente e tokens existentes, preenchimento de vínculo ausente, segunda execução real com zero inserções e snapshots idênticos, verificação somente de leitura, conflitos sem sobrescrita, rollback por falha parcial e execução concorrente aprovados. Testes anteriores do diagnóstico/reset também passaram. O schema do fixture cobre as três tabelas necessárias; não substitui uma execução no schema inteiro da aplicação no Render.

Nenhuma execução no PostgreSQL do Render foi feita nesta preparação. As quatro condições finais no banco remoto só estarão confirmadas após as saídas `committed`/`verified` e o diagnóstico independente acima.
