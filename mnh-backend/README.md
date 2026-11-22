# Massula Nerd House — Backend

API REST do sistema de gestão do clube de jogos **Massula Nerd House**.

- **Stack:** Node.js + Express + Sequelize + PostgreSQL
- **Auth:** JWT (`Authorization: Bearer <token>`), papéis `admin` e `superadmin`
- **Prefixo:** `/api` (health check em `GET /api/health`)

## Como rodar (local)

```bash
npm install
cp .env.example .env          # ajuste JWT_SECRET
docker compose up -d          # Postgres + serviço "migrate" (aplica as migrations)
npm run db:seed               # cria o superadmin (exige SEED_SUPERADMIN_* no ambiente)
npm run dev                   # nodemon
npm start                     # produção
npm run lint
```

Variáveis obrigatórias: `DATABASE_URL`, `JWT_SECRET`. Opcionais: `PORT` (3000), `JWT_EXPIRES_IN` (8h), `CORS_ORIGINS`, `DIRECT_URL`, `DB_SSL`, `DB_SSL_CA`, `DB_POOL_MAX` (5), `DB_POOL_MIN` (0). Todas documentadas em [`.env.example`](.env.example).

## Banco de dados e migrations

O schema é controlado **só** por migrations do `sequelize-cli` em `db/migrations` (o DDL inicial está em `db/sql/0001_initial_schema.sql`). Os models em `src/api/models` precisam refletir o schema.

| Script | O que faz |
|---|---|
| `npm run db:migrate` | aplica migrations pendentes |
| `npm run db:status` | lista migrations `up`/`down` |
| `npm run db:migrate:undo` | reverte a última (a inicial exige `PERMITIR_DOWN_DESTRUTIVO=true`) |
| `npm run db:seed` | cria o superadmin inicial (idempotente) |

O CLI usa `DIRECT_URL` ou, na falta, `DATABASE_URL`, e recusa o transaction pooler (porta 6543).

**Regras:**

- Mudança de schema = migration **+** model **+** `mnh-docs/banco-de-dados.md` no mesmo commit.
- Toda tabela nova deve ter `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` na própria migration.
- Nunca usar `sequelize.sync()`.

## Banco em nuvem (Supabase + Render)

1. O projeto Supabase está em **`us-east-2`**: crie o serviço do Render em **Ohio**. O banco deve ficar perto da API, não do usuário.
2. No Supabase, desligue a **Data API** (*Settings → API*). O RLS sem policies já bloqueia `anon`/`authenticated`; a Data API desligada é a segunda barreira.
3. Use o **session pooler** (porta 5432) em `DATABASE_URL`. O Render só tem IPv4, então a conexão direta `db.<ref>.supabase.co` (IPv6) não funciona.
4. Defina `DB_SSL=true` e `DB_SSL_CA` com o certificado de *Database Settings → SSL*. O SSL sempre verifica o certificado; sem a CA correta, a conexão falha.
5. Da sua máquina, com o `.env` apontando para o Supabase: `npm run db:migrate`, depois `npm run db:status`, depois `npm run db:seed`. Remova as `SEED_*` em seguida.
6. No Render, configure só `DATABASE_URL`, `DB_SSL`, `DB_SSL_CA`, `JWT_SECRET`, `JWT_EXPIRES_IN` e `CORS_ORIGINS`.

Limitações do plano free: o Supabase pausa após 7 dias sem uso e não tem backup baixável; o Render hiberna após 15 min sem tráfego (cold start de ~30–60s).

## Principais grupos de rotas

| Grupo | Base | Observação |
|---|---|---|
| Auth | `/api/auth` | login com rate limit |
| Usuários | `/api/usuario` | listar/registrar/atualizar/desativar/reativar (superadmin) |
| Jogadores | `/api/jogador` | CRUD + presença rápida |
| Jogos | `/api/jogo` | CRUD (superadmin para mutações) |
| Catálogo de níveis | `/api/nivel-jogo` | CRUD de `nivel_jogo` por jogo (superadmin para mutações) |
| Partidas | `/api/partida` | CRUD + ranking + participantes |
| Presenças | `/api/presenca` | listar por período + registrar |
| Níveis do jogador | `/api/jogador-nivel` | obter/listar/definir nível |

## Regras de negócio

- **Patente:** `1` (<10 presenças), `2` (≥10), `3` (≥50), `4` (≥100), `5` (≥200), `6` (≥300).
- **Presença:** data `dd/mm/aaaa`, não futura e única por jogador/dia.
- **Nível:** jogador só entra em partida se tiver nível cadastrado para o jogo.
- **Desativar nível:** bloqueado (409) se houver jogadores vinculados.
- **Soft delete:** `ativo` em jogador/jogo/usuário/nível; partida usa hard delete.
- **`config_campos`:** validado como `[{ nome, tipo: "texto" | "numero" }]`.

## Pendências conhecidas

- Endpoints de agregação do dashboard (RF-004/005/006) ainda não implementados.
- Formato de resposta de sucesso é inconsistente entre controllers.
