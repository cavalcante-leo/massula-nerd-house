# Massula Nerd House — Especificação de UI ("Pen & Paper Neo Brutalista")

> Este documento é a **fonte única de verdade** para a geração da interface web do sistema de gestão do **Massula Nerd House** (bar de jogos de tabuleiro). Ele consolida a especificação de API/telas com o protótipo visual **design-2**: minimalista **neo brutalista** de "papel e caneta" — fundo papel com grade sutil de caderno, tinta preta em bordas grossas, cantos retos, sombra dura de offset e um único acento verde. Cada tela abaixo mapeia 1:1 para endpoints existentes (ou planejados) do backend.

## 1. Visão geral

| Item | Valor |
|---|---|
| Produto | Massula Nerd House — painel de gestão |
| Usuários | `superadmin` e `admin` |
| Stack (backend) | Node.js + Express + Sequelize + PostgreSQL |
| Estilo | **Pen & Paper Neo Brutalista** — papel, tinta, sombra dura e acento verde; minimalista e direto |
| Idioma (UI) | Português (pt-BR) |
| Escopo | Todas as telas da API (auth, jogadores, jogos, partidas, presenças, níveis, usuários, dashboard) |

## 2. Sistema de Design

### 2.1 Regras de estilo (obrigatórias)

- **Atmosfera "papel e caneta":** a interface parece uma prancheta/ficha de jogo — fundo papel claro com grade de caderno sutil, texto em tinta preta, elementos desenhados com bordas grossas e sombra dura. Nada de gradientes, transparências ou brilhos.
- **Bordas:** `2px` (cards/inputs) ou `3px` (estrutura/hero) na cor `--line` (tinta). Sem bordas claras sobrepostas.
- **Cantos:** sempre retos (`0px`). Sem arredondamento em cards, botões, inputs ou avatares.
- **Sombras:** duras de offset (`4px 4px 0 tinta`), sem blur. No hover, o elemento sobe `-2px` e a sombra acompanha; no clique, o elemento "afunda" e a sombra encolhe. Botões primários usam sombra na cor do verde escuro.
- **Cores:** paleta enxuta — papel, tinta e um único acento verde (`--accent`). Destaques secundários em amarelo marcador (`--highlight`) e perigo em vermelho. Sem cores saturadas em blocos grandes (KPIs usam card papel + acento lateral).
- **Tipografia:** títulos em **Archivo** (peso 700–800); corpo em **Inter**; numerais, rótulos, eyebrows e badges em **JetBrains Mono** (caixa alta). Sem caixa alta forçada no corpo — apenas *eyebrows*, rótulos pequenos e badges.
- **Botões:** primário = verde com sombra verde escura; secundário = amarelo marcador; perigo = vermelho; fantasma = papel com contorno tinta. Cantos retos.
- **Microinterações:** hover com leve elevação; clique com "afundar"; foco visível (`outline` verde). Cards de jogo sobem no hover, sem rotação.
- **Estados vazios e de carregamento:** sempre desenhados — borda tracejada tinta + frase convite. Skeleton em listras de papel.
- **Nomes/código:** todo texto da UI em pt-BR; nomes de classes/JS em inglês.

### 2.2 Paleta de cores (tokens)

```css
:root {
  /* Base — papel e tinta */
  --bg:          #F3F0E7;  /* fundo da página (papel) */
  --surface:     #FFFFFF;  /* cards e painéis (papel branco) */
  --surface-2:   #ECE8DB;  /* zebra / trilho / hover */
  --ink:         #16130F;  /* texto principal e bordas (tinta) */
  --ink-soft:    #5A5448;  /* texto secundário */
  --line:        #16130F;  /* borda forte */
  --line-soft:   #D4CDB8;  /* divisórias suaves */

  /* Acentos */
  --accent:      #35624A;  /* ação primária — verde */
  --accent-ink:  #274A38;  /* verde escuro (sombra do primário) */
  --accent-soft: #DFE9E0;  /* verde claro (pills de sucesso) */
  --danger:      #C1443C;  /* perigo — vermelho */
  --highlight:   #F5E06B;  /* destaque secundário — amarelo marcador */

  /* Tipografia */
  --font-display: 'Archivo', sans-serif;    /* títulos */
  --font-body:    'Inter', sans-serif;      /* corpo, labels, botões */
  --font-mono:    'JetBrains Mono', monospace; /* numerais, eyebrows, badges */

  /* Layout */
  --sidebar-w: 232px;
  --radius:     0px;
  --shadow:     4px 4px 0 var(--ink);
  --shadow-sm:  3px 3px 0 var(--ink);
  --shadow-lg:  6px 6px 0 var(--ink);
  --shadow-accent: 4px 4px 0 var(--accent-ink);

  /* Espaçamento */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
}
```

### 2.3 Biblioteca de componentes (construir uma vez, reutilizar)

- **Botão** — `.btn` (base) + `.btn-primary` (verde) / `.btn-secondary` (amarelo marcador) / `.btn-danger` (vermelho) / `.btn-ghost` (contorno) / `.btn-sm`. Cantos retos, borda tinta, sombra dura; hover sobe, active afunda.
- **Input / Select / Textarea** — fundo `--surface`, borda `2px --ink`, raio `0px`; rótulo pequeno mono em caixa alta; foco com sombra verde de offset.
- **Card** — `.card`: fundo `--surface`, borda `2px --ink`, raio `0px`, sombra dura. Variantes: `hero` (borda `3px`, sombra maior), `sticker` (sobe no hover) para jogos.
- **Tabela** — cabeçalho mono uppercase com borda inferior `2px --ink`; células com borda inferior `1px --line-soft`; hover em `--surface-2`. Ações agrupadas em menu kebab.
- **Menu Kebab** — `.menu` com botão `⋯`; dropdown com itens (`Ver`/`Editar`/`Desativar`…). Máximo 1 ação primária visível por linha.
- **Badge / Pill** — retangular, contorno tinta, mono uppercase. **Patente (1–6)**: pill `P1..P6` com escala do papel ao vermelho.
- **Avatar** — quadrado com iniciais, preenchido por cor da paleta fixa (verde, amarelo, vermelho, tinta...) — cor segue a posição na lista, não aleatória.
- **Sidebar** — fundo `--ink` escuro, itens em papel, item ativo em verde com borda esquerda amarela `4px`; rodapé com usuário + Sair. Marca: apenas wordmark ("Massula / NERD HOUSE"), **sem ícone "M"**.
- **Tabs** — abas separadas; ativa preenchida em verde (texto papel).
- **Telas de formulário** — criação/edição em páginas dedicadas (`/novo`, `/:id/editar`), nunca em modal. Confirmações (excluir/desativar) usam modal.
- **Toast** — card reto com borda tinta e sombra dura, some após ~3s.
- **Pódio** — blocos retos com borda e sombra dura; `1º` no centro (amarelo marcador), `2º`/`3º` nas laterais (papel).
- **Construtor de campos dinâmicos** — linhas `{nome + tipo texto|numero|booleano + remover}`; preview do JSON em bloco mono escuro.
- **Vazio / Carregamento** — bloco com borda tracejada tinta e frase convite; skeleton em listras de papel.

## 3. Navegação e arquitetura da informação

- **Sidebar** fixa à esquerda: Painel, Jogadores, Jogos, Partidas, Presenças, Usuários (somente `superadmin`). Rodapé: cartão do usuário logado + **Sair**.
- `admin` vê tudo exceto **Usuários** e as ações de mutação de Jogos (criar/editar/desativar/reativar).
- `superadmin` gerencia jogos e usuários.
- **Topbar** mostra saudação/título da página, subtítulo descritivo e o perfil do usuário (avatar + nome + papel) à direita. Cabeçalho de página com data atual em `dd/mm`.

```
Login
└── (autenticado) Estrutura do app
    ├── Dashboard
    ├── Jogadores
    │   ├── Lista
    │   ├── Cadastro/Edição (tela: /jogadores/novo, /jogadores/:id/editar)
    │   └── Detalhe (perfil + abas: Estatísticas · Níveis · Histórico)
    ├── Jogos
    │   ├── Lista (grade de cards-capa)
    │   ├── Cadastro/Edição (tela: /jogos/novo, /jogos/:id/editar)
    │   ├── Níveis (tela: /jogos/:id/niveis/novo, /jogos/:id/niveis/:nivelId/editar)
    │   └── Detalhe (melhores jogadores + níveis)
    ├── Partidas
    │   ├── Lista (filtros persistentes, agrupamento por data)
    │   ├── Nova/Edição (tela: /partidas/nova, /partidas/:id/editar)
    │   ├── Participantes (tela: /partidas/:id/jogadores/novo, /partidas/:id/jogadores/:jogadorId/editar)
    │   └── Detalhe (pódio + participantes + colunas dinâmicas)
    ├── Presenças (período + registro em /presencas/nova)
    ├── Usuários (superadmin)
    │   ├── Lista
    │   └── Cadastro (tela)
    └── Meu Perfil
```

## 4. Telas

Cada tela lista propósito, endpoints, permissão, layout e elementos principais. Colunas de tabelas e formulários de estatística de partida são **sempre dinâmicos** a partir de `config_campos` do jogo.

---

### 4.1 Login

- **Endpoints:** `POST /api/auth/login` → `{ nome, senha }` → `{ accessToken, usuario: { id, nome, nome_usuario, tipo } }`
- **Permissão:** público.
- **Layout:** card centralizado "ficha de jogo": fundo `--bg`, título grande Archivo "Massula Nerd House" (wordmark, sem ícone "M"), subtítulo, form card `--surface` com borda tinta e sombra dura.
- **Elementos:** input texto (nome), input senha, botão primário "ENTRAR" (feltro), banner de erro vermelho-dado.
- **Comportamento:** guarda `accessToken` + `usuario`; roteia para o Dashboard no sucesso; mostra mensagem de rate-limit em 429.

---

### 4.2 Dashboard

- **Endpoints:** agregações (RF-006 — planejado): jogador da semana/mês/ano, jogo da semana/mês/ano, jogos mais jogados, presenças por patente. Partidas recentes via `GET /api/partida/listar`.
- **Permissão:** qualquer autenticado.
- **Layout:** grade de KPIs (4) + cards hero + gráficos de barras.
- **Elementos:**
  - KPIs: Total de partidas (feltro), Presenças no mês (madeira), Total de jogadores (dado), Jogos ativos (marrom madeira `--wood-fill`) — cada um com badge de delta opcional.
  - Card hero dourado (gradiente permitido): "Jogador em destaque" com avatar, nome, selo de patente e mini-estatísticas (vitórias/presenças/jogos).
  - Card hero feltro: "Jogo em alta" com nome e nº de partidas.
  - Barra horizontal "Jogos mais jogados" (top 5) e "Presenças por patente" (P1–P6) — trilho `--parchment-2`, preenchimento feltro.
  - Lista de partidas recentes.

---

### 4.3 Jogadores — Lista

- **Endpoints:** `GET /api/jogador/listar` (opcional `?ativo=true|false`) → `[{ id, nome, instagram, telefone, ativo, total_presencas, patente, criado_por }]`
- **Permissão:** qualquer autenticado.
- **Layout:** toolbar (busca + chips Todos/Ativos/Inativos) + botão "NOVO JOGADOR" + tabela em card.
- **Elementos:** colunas Nome (avatar + desde `criado_por`?), Instagram, Telefone, Presenças, Patente (pill P1–P6), Status (pill), Ações (Ver / Editar / Desativar ou Reativar).

---

### 4.4 Jogador — Cadastro / Edição

- **Endpoints:** `POST /api/jogador/registrar`; `PUT /api/jogador/atualizar/:id`
- **Permissão:** qualquer autenticado.
- **Layout:** modal com cabeçalho em madeira escura.
- **Elementos:** Nome (obrigatório), Instagram, Telefone; na edição, toggle de status. Botão Salvar (feltro); validação inline.

---

### 4.5 Jogador — Detalhe

- **Endpoints:** `GET /api/jogador/listar/:id`; `GET /api/jogador-nivel/jogador/:id_jogador`; `GET /api/presenca/listar?inicio&fim`; agregações (RF-004 — planejado).
- **Permissão:** qualquer autenticado.
- **Layout:** card de perfil hero no topo + abas.
- **Elementos:**
  - Perfil: avatar grande, nome, instagram/telefone, presenças totais, patente, status, ações (Registrar presença / Editar / Desativar).
  - Aba "Estatísticas": jogos mais jogados (barras), partidas ganhas, total por jogo.
  - Aba "Níveis": nível por jogo com stepper inline + salvar.
  - Aba "Histórico": presenças do período + botão registrar presença.

---

### 4.6 Jogos — Lista

- **Endpoints:** `GET /api/jogo/listar` (opcional `?ativo=true|false`)
- **Permissão:** listar = qualquer autenticado; criar/editar/desativar = **superadmin**.
- **Layout:** toolbar + **grade de cards-capa** (sticker, rotação `-1deg`), como caixas na estante.
- **Elementos:** capa colorida (uma cor de acento por jogo) com iniciais/nome, corpo com nome, nº de campos, status; ações Ver + (Editar/Reativar apenas superadmin).

---

### 4.7 Jogo — Cadastro / Edição

- **Endpoints:** `POST /api/jogo/registrar`; `PUT /api/jogo/atualizar/:id`. Body `config_campos: [{ nome, tipo }]`, `tipo ∈ texto | numero`.
- **Permissão:** **superadmin**.
- **Layout:** modal com construtor de campos dinâmicos.
- **Elementos:** Nome, Descrição, linhas `{nome + tipo}` com botão remover, "+ Adicionar campo", preview do JSON resultante em bloco escuro monoespaçado, status na edição.

---

### 4.8 Jogo — Detalhe

- **Endpoints:** `GET /api/jogo/listar/:id`; `GET /api/jogador-nivel/jogo/:id_jogo`; agregações (RF-005 — planejado).
- **Permissão:** qualquer autenticado.
- **Layout:** card header hero + seções.
- **Elementos:** nome em destaque, descrição, chips de `config_campos`, KPI total de partidas, status. Seção "Melhores jogadores" (mais partidas / mais vitórias). Seção "Níveis" (jogador × nível).

---

### 4.9 Partidas — Lista

- **Endpoints:** `GET /api/partida/listar` com filtros `id_jogo`, `id_nivel_jogo`, `jogada_em_inicio`, `jogada_em_fim`.
- **Permissão:** qualquer autenticado.
- **Layout:** toolbar com filtros (jogo, nível, período) + "NOVA PARTIDA" + tabela.
- **Elementos:** colunas Jogo, Nível, Data (`dd/mm/aaaa`), Criado por, Ações (Ver / Editar / Excluir → modal de confirmação).

---

### 4.10 Partida — Nova / Edição

- **Endpoints:** `POST /api/partida/registrar` → `{ id_jogo, nivel, jogada_em }`; `PUT /api/partida/atualizar/:id`
- **Permissão:** qualquer autenticado.
- **Layout:** modal.
- **Elementos:** Jogo (select, obrigatório), Nível (número `>= 1`), Data/hora (datetime). Ao salvar, redireciona ao detalhe para adicionar participantes.

---

### 4.11 Partida — Detalhe (pódio + participantes)

- **Endpoints:** `GET /api/partida/listar/:id`; `GET /api/partida/:id/ranking`; `GET /api/partida/:id_partida/jogadores`.
- **Permissão:** qualquer autenticado.
- **Layout:** header da partida + pódio (top 3) + tabela de participantes.
- **Elementos:**
  - Header: jogo · nível, data/hora, status.
  - Pódio: `1º` (dourado, centro), `2º`/`3º` (laterais).
  - Tabela: Posição, Jogador, Vencedor (✓), **colunas dinâmicas** de `config_campos`, Ações (Editar resultado / Remover).
  - Botão "ADICIONAR JOGADOR" abre o modal de participante.

---

### 4.12 Participante — Adicionar / Editar resultado

- **Endpoints:** `POST /api/partida/:id_partida/jogador/:id_jogador` (body `{ posicao_final }`); `PUT ...` (`{ posicao_final, estatisticas, vencedor }`); `DELETE ...`.
- **Permissão:** qualquer autenticado.
- **Layout:** modal.
- **Elementos:** Jogador (select de quem ainda não está na partida), Posição final (`>= 1`), inputs dinâmicos de `estatisticas` (texto → input text; numero → input number), toggle Vencedor (auto quando `posicao_final === 1`).
- **Validação:** avisar (banner dourado) quando o jogador não tem nível para o jogo e oferecer atalho "Definir nível agora".

---

### 4.13 Presenças

- **Endpoints:** `GET /api/presenca/listar?inicio&fim` (dd/mm/aaaa); `POST /api/presenca/registrar/:id_jogador` (`{ data }`); quick `POST /api/jogador/registrarPresenca/:id`.
- **Permissão:** qualquer autenticado.
- **Layout:** toolbar com intervalo de datas + "REGISTRAR PRESENÇA" + painéis de frequência por jogador + tabela.
- **Elementos:** grade de células (quadradinhos por semana; verde = presente, vazio = ausente) por jogador e tabela (Data, Jogador, Criado por). Ações rápidas "presença hoje" na lista de jogadores.

---

### 4.14 Níveis do Jogador por Jogo

- **Endpoints:** `GET/PUT /api/jogador-nivel/jogador/:id_jogador/jogo/:id_jogo` etc.
- **Permissão:** qualquer autenticado.
- **Layout:** acessível do Detalhe do Jogador (aba "Níveis") e do Detalhe do Jogo (seção "Níveis").
- **Elementos:** pares `jogo → nível` com stepper inline + salvar; modal "definir nível" vindo do fluxo de participante.

---

### 4.15 Usuários (superadmin)

- **Endpoints:** `GET /api/usuario/listar`; `POST /api/usuario/registrar` (`senha ≥ 8`, `tipo ∈ admin | superadmin`); `PUT /api/usuario/atualizar/:id`; `PUT /api/usuario/desativar/:id`; `PUT /api/usuario/reativar/:id`.
- **Permissão:** **superadmin**.
- **Layout:** toolbar + tabela + modal de criação.
- **Elementos:** colunas Nome, Usuário, Tipo (pill), Status, Criado por. Badge "planejado" nas ações indisponíveis.

---

### 4.16 Meu Perfil

- **Endpoints:** `GET /api/usuario/listar/:id` (self).
- **Permissão:** qualquer autenticado.
- **Layout:** card simples.
- **Elementos:** avatar, nome, nome de usuário, badges de tipo/status, botão "Alterar senha" desabilitado (planejado).

## 5. Mapa Endpoint ↔ Tela

| Endpoint | Tela |
|---|---|
| `POST /api/auth/login` | 4.1 Login |
| `POST /api/usuario/registrar` | 4.15 Usuários |
| `GET /api/usuario/listar` | 4.15 Usuários |
| `GET /api/usuario/listar/:id` | 4.16 Meu Perfil |
| `POST /api/jogador/registrar` | 4.4 Cadastro |
| `GET /api/jogador/listar` | 4.3 Lista |
| `GET /api/jogador/listar/:id` | 4.5 Detalhe |
| `PUT /api/jogador/atualizar/:id` | 4.4 Edição |
| `PUT /api/jogador/desativar/:id` | 4.3/4.5 Desativar |
| `PUT /api/jogador/reativar/:id` | 4.3/4.5 Reativar |
| `POST /api/jogador/registrarPresenca/:id` | 4.13 Presença rápida |
| `POST /api/jogo/registrar` | 4.7 Cadastro |
| `GET /api/jogo/listar` | 4.6 Lista |
| `GET /api/jogo/listar/:id` | 4.8 Detalhe |
| `PUT /api/jogo/atualizar/:id` | 4.7 Edição |
| `PUT/DELETE /api/jogo/desativar|reativar/:id` | 4.6 Desativar/Reativar |
| `POST /api/partida/registrar` | 4.10 Nova |
| `GET /api/partida/listar` | 4.9 Lista |
| `GET /api/partida/listar/:id` | 4.11 Detalhe |
| `PUT /api/partida/atualizar/:id` | 4.10 Edição |
| `DELETE /api/partida/remover/:id` | 4.9 Excluir |
| `GET /api/partida/:id/ranking` | 4.11 Ranking |
| `GET /api/partida/:id_partida/jogadores` | 4.11 Participantes |
| `POST/PUT/DELETE /api/partida/:id_partida/jogador/:id_jogador` | 4.12 Participante |
| `POST /api/presenca/registrar/:id_jogador` | 4.13 Registrar |
| `GET /api/presenca/listar` | 4.13 Presenças |
| `GET /api/jogador-nivel/...` | 4.5/4.8/4.14 Níveis |
| `PUT /api/jogador-nivel/jogador/:id_jogador/jogo/:id_jogo` | 4.14 Definir nível |
| `GET /api/nivel-jogo/jogo/:id_jogo` | 4.8/4.14 Catálogo de níveis |
| `GET /api/nivel-jogo/:id` | 4.14 Nível do catálogo |
| `POST /api/nivel-jogo/registrar` | 4.14 Novo nível (superadmin) |
| `PUT /api/nivel-jogo/atualizar/:id` | 4.14 Editar nível (superadmin) |
| `PUT /api/nivel-jogo/desativar/:id` | 4.14 Desativar nível (superadmin) |
| `PUT /api/nivel-jogo/reativar/:id` | 4.14 Reativar nível (superadmin) |
| `PUT /api/usuario/atualizar/:id` | 4.15 Editar usuário |
| `PUT /api/usuario/desativar/:id` | 4.15 Desativar usuário (superadmin) |
| `PUT /api/usuario/reativar/:id` | 4.15 Reativar usuário (superadmin) |

## 6. Notas técnicas para o gerador

- **Patente (rank):** calculada pelo total de presenças — `1` (<10), `2` (≥10), `3` (≥50), `4` (≥100), `5` (≥200), `6` (≥300). Exibir como pill `P1..P6`.
- **Campos dinâmicos:** jogos definem `config_campos` (`[{ nome, tipo }]`, `tipo ∈ texto | numero | booleano`). Resultados guardam `estatisticas` em JSON. Todo formulário/tabela de estatística de partida deve renderizar dinamicamente a partir dessas configurações — nunca campos fixos. Campo `booleano` renderiza como checkbox (formulário) e `✓/—` (tabela).
- **Exigência de nível:** jogador só entra em partida se tiver nível para o jogo. UI sinaliza com banner dourado e atalho para definir nível.
- **Soft delete:** `ativo` booleano em jogadores/jogos/usuários. Listas filtram por status; "desativar" pede confirmação; "reativar" para linhas inativas.
- **Datas:** presença usa `dd/mm/aaaa`; partida (`jogada_em`) usa ISO 8601. Inputs convertem e exibem `dd/mm/aaaa`.
- **Planejados:** as agregações do Dashboard (RF-004/005/006) seguem sem endpoint dedicado e usam os dados disponíveis na UI. As ações de usuário (editar/desativar/reativar) e o catálogo de níveis (`/api/nivel-jogo/*`) já têm rota registrada.
- **Papéis:** `superadmin` = acesso total (CRUD jogos + usuários); `admin` = tudo exceto gestão de usuários e mutações de jogos. Sidebar e ações respeitam `usuario.tipo` do login.
- **Respostas:** erro `{ erro: "mensagem" }`, sucesso `{ sucesso: ... }`. Toasts tratam as duas formas (vermelho-dado erro; feltro sucesso).

## 7. Instruções ao modelo gerador de interface

1. Implementar **todas as telas** da seção 4, cada uma ligada aos endpoints da seção 5.
2. Aplicar o estilo **Pen & Paper Neo Brutalista** da seção 2: papel, tinta, acento verde, amarelo marcador; cantos retos, sombra dura, sem gradientes.
3. Usar os **tokens** da seção 2.2 exatamente como definidos (incluindo a escala de espaçamento `--space-*`).
4. Construir a **biblioteca de componentes** (2.3) uma vez e compor as telas.
5. Implementar **renderização dinâmica** de `config_campos`/`estatisticas`, incluindo o tipo `booleano`.
6. Implementar **UI por papel** (superadmin/admin) na sidebar e nas ações.
7. Tratar **fluxo de autenticação**: token salvo no login, `Authorization: Bearer <token>`, redirecionar não autenticado para Login, 401 = sessão expirada.
8. Criação/edição em **telas dedicadas** (rotas deep-linkable); modais apenas para confirmações.
9. Texto da UI em **pt-BR**; código/comentários em inglês.
