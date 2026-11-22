# Massula Nerd House — Backend

API REST do sistema de gestão do clube de jogos **Massula Nerd House**.

- **Stack:** Node.js + Express + Sequelize + PostgreSQL
- **Auth:** JWT (`Authorization: Bearer <token>`), papéis `admin` e `superadmin`
- **Prefixo:** `/api` (health check em `GET /api/health`)

## Como rodar

```bash
npm install
# configure .env com DATABASE_URL e JWT_SECRET
npm run dev      # nodemon
npm start        # produção
npm run lint
```

Variáveis de ambiente obrigatórias: `DATABASE_URL`, `JWT_SECRET`. Opcionais: `PORT` (3000), `JWT_EXPIRES_IN` (8h), `CORS_ORIGINS` (lista separada por vírgula), `DB_POOL_MAX`, `DB_POOL_MIN`.

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
