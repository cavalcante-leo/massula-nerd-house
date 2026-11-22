# Massula Nerd House

Sistema de gestão do clube de jogos Massula Nerd House: jogadores, presenças, jogos, níveis e partidas, com ranking.

## Estrutura

| Pasta | O que é |
|---|---|
| `mnh-backend/` | API REST: Node.js + Express + Sequelize (CommonJS). Detalhes de rotas e regras de negócio no `mnh-backend/README.md`. |
| `mnh-frontend/` | SPA React 18 + TypeScript + Vite (PWA), React Query, Zustand, react-hook-form + zod. Fala **só** com a API (`VITE_API_URL`), nunca direto com o banco. |
| `mnh-docs/` | `banco-de-dados.md` (modelo de dados), `design.md`, `diagrams/der.canvas` (Obsidian). |
| `backlog.md` | Achados não bloqueantes da `/critique`, para revisar depois. Não entra nos commits de feature. |

## Infra

- **Banco:** Supabase (Postgres 17) em `us-east-2`, acessado só como Postgres. O app não usa supabase-js nem Supabase Auth: a autenticação é JWT próprio, com papéis `admin` e `superadmin`.
- **API:** Render Free (deploy ainda a configurar), região **Ohio**, para ficar perto do banco. É um processo contínuo com 1 instância, que hiberna após 15 min sem tráfego. **Não é serverless.**
- **Conexão:**
  - **Session pooler**, porta 5432, em `DATABASE_URL`. O transaction pooler (6543) não é usado, e o CLI recusa essa porta.
  - SSL sempre verifica o certificado: `DB_SSL=true` + `DB_SSL_CA` (PEM numa linha, com `\n` literais).
  - Pool padrão `max 5 / idle 30s`, em `src/api/config/dbOptions.js`.
- **Local:** `docker compose up -d` em `mnh-backend/` sobe o Postgres 16 e o serviço `migrate`. As variáveis estão documentadas em `mnh-backend/.env.example`.
- Datas: colunas `TIMESTAMPTZ`/`DATE` e servidor em UTC. Não reintroduzir `timezone` de sessão no Sequelize.

## Banco de dados: regras

- O schema é controlado **só** por migrations do `sequelize-cli` (`mnh-backend/db/migrations`). O DDL inicial está em `db/sql/0001_initial_schema.sql`. Não existe mais Prisma.
- Mudança de schema = **migration + model Sequelize + `mnh-docs/banco-de-dados.md`** no mesmo commit.
- Toda tabela nova: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` na própria migration, sem policies. O backend conecta como dono das tabelas.
- Nunca usar `sequelize.sync()`.
- `atualizado_em` é `NOT NULL` sem default. Inserts fora dos models (`bulkInsert`, SQL cru) precisam preencher `criado_em`/`atualizado_em`.
- `down` destrutivo exige opt-in explícito (ex.: `PERMITIR_DOWN_DESTRUTIVO=true`).
- Para testar migrations, use um **banco descartável** no container (`CREATE DATABASE mnh_<algo>_test`) e apague no fim. Não teste no banco de trabalho.
- Scripts: `npm run db:migrate`, `db:status`, `db:migrate:undo`, `db:seed` (superadmin via `SEED_SUPERADMIN_*`, idempotente).

## Fluxo de trabalho (obrigatório)

1. **Planejar antes de codar.** Para features, apresente o plano com riscos ordenados por impacto e a sequência de commits, e espere a aprovação.
2. **Branch dedicada** por feature, a partir de `main` limpa. Se houver mudanças sem commit na `main`, pare e avise.
3. **Commits pequenos e de responsabilidade única.** Cada commit deixa o projeto funcionando: lint e boot passando. Ordene os commits para que nenhum estado intermediário quebre (ex.: atualizar quem consome antes de remover o que é consumido).
4. **Stage só por caminho** (`git add <arquivos>`), nunca `-A` ou `.`. Antes do gate, confira se não há nada staged além do esperado.
5. **Antes de cada commit:**
   1. Rode as checagens do commit: lint, boot e os testes específicos da mudança.
   2. Rode a skill **`/critique`** sobre o `git diff --staged`.
   3. **Bloqueante ou grave** (bug, segurança, perda de dados, quebra de boot ou migration, divergência model × SQL): **não leve ao gate**. Corrija e repita os passos 1 e 2.
   4. **Não bloqueante:** registre no `backlog.md` (commit de origem, arquivo:linha, achado, por que não bloqueia, sugestão).
6. **Gate de aprovação:** mostre os arquivos, o diff, o resultado das checagens, o resumo da critique (o que foi corrigido e o que foi para o backlog) e a mensagem proposta. **Só commite após o "ok" explícito.**
7. **Mensagens:** Conventional Commits em português (`feat(db): ...`, `fix: ...`, `docs: ...`). **Nunca** adicionar `Co-Authored-By` nem qualquer assinatura do Claude.
8. **Sem push e sem PR** sem pedido explícito.
9. **Ações destrutivas** (`docker compose down -v`, `DROP`, apagar dados, mexer no Supabase de produção) só com confirmação explícita, dizendo o que será perdido.
10. **Segredos:** nunca versionar `.env`. Não imprimir senhas, URLs com senha ou tokens no terminal. Credenciais de seed saem do `.env` logo após o uso.

## Convenções de código

- Backend em CommonJS, ESLint (`npm run lint` em `mnh-backend/`). Nomes de domínio, comentários e mensagens de erro em português.
- Respostas de erro: `{ erro: "<mensagem>" }`. Não vazar `err.message` para o cliente (ver backlog).
- Datas de entrada no formato `dd/mm/aaaa` (helpers em `src/helpers/data.helpers.js`).
