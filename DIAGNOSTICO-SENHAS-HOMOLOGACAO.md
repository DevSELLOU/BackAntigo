# Diagnóstico somente de leitura do PR #2

O PR #2 já foi incorporado à branch `homologacao`. A mensagem `HOMOLOG_PASSWORD_RESET failed` omite intencionalmente o erro original. Ela, sozinha, não identifica a causa. O script novo não executa reset, não importa bcrypt, não compara senhas com hashes, não cria marcador e não inicia o bootstrap da API (que usa `sequelize.sync({alter:true})`).

## Executar no Render

Depois que esta mudança estiver disponível na branch do **backend de homologação**, configure antes do deploy:

| Campo | Valor |
| --- | --- |
| Docker Command | `node scripts/diagnose-homologacao-passwords.cjs` |
| `RESET_HOMOLOG_PASSWORDS_ONCE` | `false` |
| `SEED_HOMOLOGACAO` | `false` |

Mantenha as demais variáveis atuais, incluindo `HOMOLOG_ADMIN_PASSWORD`, para diagnosticar sua configuração sem imprimir valores. Os guards permanecem iguais ao reset: `APP_ENV=homologacao`, `NODE_ENV=production`, host interno `dpg-db4ko6vavr4c73fkjdag-a`, banco/usuário `sellou_homologacao`, porta 5432, `DB_TLS=true`. Além desses guards, o diagnóstico exige a flag de reset desligada. Não habilite seed nem reset para investigar.

Execute **Manual Deploy → Deploy latest commit** e procure a linha `HOMOLOG_PASSWORD_DIAGNOSTIC` nos logs. Se Shell já estiver disponível no plano atual, pode executar diretamente `node scripts/diagnose-homologacao-passwords.cjs` com as flags desligadas, sem alterar o Docker Command.

O comando é pontual e termina sem abrir servidor HTTP. Executado como Docker Command de Web Service, o Render pode marcar o deploy como falho por término do processo/health check e repetir tentativas; isso é esperado e não significa que a consulta escreveu no banco. Use a saída JSON para avaliar o diagnóstico. Não encadeie `npm start`, seed ou entrypoint normal neste comando: isso iniciaria o bootstrap com alterações de schema. Não é necessário contratar plano pago.

Após coletar o resultado, remova o Docker Command de diagnóstico para restaurar o CMD normal, mantendo `RESET_HOMOLOG_PASSWORDS_ONCE=false` e `SEED_HOMOLOGACAO=false`. Não faça redeploy do startup normal enquanto o requisito continuar sendo zero alterações de schema/dados, pois o bootstrap existente pode executar sincronização. Este trabalho não modifica esse comportamento.

## Ler o resultado

| Chave | Significado |
| --- | --- |
| `environment` | `checks` contém somente nomes de variáveis e booleanos. `false` identifica a variável fora da pré-condição. Não revela valor, comprimento ou trecho da senha. Se falhar, não conecta. |
| `postgres_connection` | Conexão e TLS; motivos seguros como `authentication_rejected`, `dns_failed`, `connection_refused`, `tls_certificate_rejected`, `connection_timeout` ou `unclassified_error`. Nunca imprime mensagem do driver. |
| `database_identity` | Compara identidade real de banco e usuário, retornando apenas booleanos. Se divergir, interrompe as consultas de dados. |
| `operation_marker` | `table_absent_not_completed`: tabela ainda não criada; `not_completed`: registro ausente; `already_completed_reset_will_skip`: reset já concluído. Nenhuma dessas situações causa, por si só, o erro genérico original. Tabela ausente não é criada. Erros de SELECT são reportados à parte. |
| `fictional_company` | Exige exatamente uma empresa, com CNPJ/nome/alias fictícios do seed. Indica contagem divergente ou identidade divergente sem imprimir registros. |
| `six_users` | Confere existência dos seis emails fixos e associação à empresa. Retorna `six_exist` e `company_matches`; `null` significa que a empresa não pôde ser validada. Não consulta a coluna password. |
| `user_companies` | Exige os seis vínculos exatos e detecta ausência, duplicidade ou empresa adicional. Não altera papéis ou status. |

`status=failed` identifica falha de validação/consulta. `blocked` depende de etapa anterior que não passou. `not_checked` indica etapa não alcançada. Consultas independentes prosseguem com savepoints após erro de SELECT. Todas as consultas de dados usam uma única transação `REPEATABLE READ READ ONLY`, encerrada com `ROLLBACK`; nenhum `CREATE`, `UPDATE`, `INSERT`, `DELETE` ou bloqueio de linha é usado.

`driver_or_tls_setup_failed` aponta problema no carregamento do driver/helper compilado de TLS; `table_missing`, `column_missing` e `permission_denied` apontam schema/permissões. Um marcador já concluído não prova que a senha atual coincide com a variável: o diagnóstico não consulta hashes. O diagnóstico não testa privilégios de escrita, hashing bcrypt ou a execução futura do UPDATE; todas as pré-condições podem passar e ainda existir falha específica da fase de escrita. A saída reflete um snapshot de leitura, não reserva a execução de um reset posterior.

Testes: `node --test scripts/diagnose-homologacao-passwords.test.cjs scripts/reset-homologacao-passwords.test.cjs`. Cliente PostgreSQL simulado, com injeção de erros contendo segredo fictício para verificar redação. Não houve consulta ao banco Render nem alteração de dados nesta preparação.
