# Redefinição única das seis senhas de teste no Render

O seed completo (`codex/seed-homologacao-completo`) verifica a senha dos usuários já existentes com bcrypt e aborta se ela divergir. Ele não redefine senhas. Alterar `HOMOLOG_ADMIN_PASSWORD` não altera o hash armazenado. O seed da branch `homologacao` tem a mesma proteção, mas cria somente o administrador. Não há evidência de qual senha está atualmente no banco; não é necessário descobrir ou expor esse valor.

Esta operação separada exige os seis usuários existentes: `admin`, `gerente`, `representante1`, `representante2`, `interno1` e `interno2`, todos em `@sellou-homologacao.example`. Se faltar algum, a operação falha sem criar usuários e sem confirmar alterações. Implante o seed completo separadamente se ainda não houver seis usuários; não habilite o seed junto com o reset.

## Preparar o código

Disponibilize os dois novos scripts em uma branch de homologação do backend. O PR desta mudança tem base `homologacao`; não faça merge em `main`. Os scripts são copiados pelo `Dockerfile.homologacao` existente. Mantenha Root Directory vazio, Dockerfile `./Dockerfile.homologacao`, Build Context `.` e a região atual. Nenhuma alteração de frontend é necessária.

## Configuração exata para uma execução

No **Web Service do backend de homologação**, confira primeiro que as credenciais vêm do PostgreSQL de homologação correto. Não edite Environment Groups compartilhados nem os serviços de produção.

| Campo/variável | Valor |
| --- | --- |
| Branch | Branch de homologação contendo estes scripts; após merge do PR, `homologacao` |
| Docker Command (Settings) | `node scripts/start-homologacao-password-reset.cjs` |
| `RESET_HOMOLOG_PASSWORDS_ONCE` | `true` |
| `SEED_HOMOLOGACAO` | `false` |
| `APP_ENV` | `homologacao` |
| `NODE_ENV` | `production` (modo do framework) |
| `DB_HOST` | `dpg-db4ko6vavr4c73fkjdag-a` (somente hostname interno autorizado) |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `sellou_homologacao` |
| `DB_USERNAME` | `sellou_homologacao` |
| `DB_PASSWORD` | Manter o segredo do PostgreSQL de homologação |
| `DB_TLS` | `true` |
| `DB_TLS_REJECT_UNAUTHORIZED` | `false`, para o certificado autoassinado da rede interna Render, conforme configuração existente |
| `HOMOLOG_ADMIN_PASSWORD` | Manter o valor atual desejado; 12 a 72 bytes, com maiúscula, minúscula, número e símbolo |

Não use a senha em comandos, logs, commits ou variáveis `NEXT_PUBLIC_*`. Não defina `NODE_TLS_REJECT_UNAUTHORIZED=0`. Se o recurso tiver sido recriado e o hostname interno for diferente, este script recusará conexão: revise o código para autorizar o novo recurso de homologação antes de executar.

Salve as configurações e faça **Manual Deploy → Deploy latest commit**, garantindo que o deploy selecionado contém os scripts. Não precisa de Shell, pre-deploy command, cron ou plano pago. Nenhuma redefinição deve ser colocada no build. O Docker Command temporário executa a transação antes de iniciar o entrypoint normal, sem mudar as regras de autenticação.

Nos logs, aguarde `HOMOLOG_PASSWORD_RESET completed` e depois o início normal da API. Em erro, a API não inicia e o deploy falha; corrija a causa e repita, pois uma falha transacional não confirma alterações parciais. `already-completed` significa que esta operação já foi confirmada nesse banco e nenhuma senha foi alterada nessa tentativa. `disabled` significa que a flag não estava exatamente `true`.

## Desativar imediatamente após sucesso

1. Defina `RESET_HOMOLOG_PASSWORDS_ONCE=false` (ou remova a variável).
2. Mantenha `SEED_HOMOLOGACAO=false`.
3. Limpe **Docker Command**, voltando ao CMD original da imagem: `node scripts/start-homologacao.cjs`.
4. Remova `HOMOLOG_ADMIN_PASSWORD` do serviço se não for mais necessária; guarde a senha de teste num gerenciador de senhas.
5. Salve e redeploye. Verifique `/api-json` e teste o login dos seis usuários com a senha desejada. Não registre tokens ou senhas nas capturas.

A tabela `public.homologacao_password_operations` deve permanecer. A operação fixa `reset-six-test-passwords-v1` é gravada na mesma transação das seis senhas. Mesmo se a flag continuar ligada ou dois containers tentarem executar, a trava compartilhada com o seed e o marcador impedem nova redefinição após o commit. Não apague o registro, não renomeie a operação e não trunque a tabela. Restaurar o banco a um estado anterior ao marcador remove essa garantia; este procedimento não deve ser reativado após restauração.

## Limites e validação

Somente `password`, `password_reset_token`, `password_reset_expires` e `updatedAt` dos seis emails exatos são atualizados. Cada senha recebe um hash bcrypt de custo 10, como na aplicação. Empresa e vínculos são conferidos; status, papéis, permissões e demais dados são preservados. Tokens de recuperação antigos são limpos. JWTs existentes seguem a política atual de expiração.

Testes locais: `node --test scripts/reset-homologacao-passwords.test.cjs`. Cobrem bloqueios de ambiente/recurso/TLS/senha, flag desligada, seleção dos seis usuários, segunda execução e rollback por identidade divergente, usuário ausente ou falha parcial. Usam cliente simulado; não substituem integração real de PostgreSQL. Esta preparação não executou reset nem deploy no Render e não verificou login no banco remoto.
