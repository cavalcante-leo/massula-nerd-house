const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

// Um ambiente por arquivo: encerrar() fecha a conexão compartilhada do app.
let amb;
let token;
before(async () => {
  amb = await prepararAmbiente();
  token = amb.tokenSuperadmin();
});
after(async () => { await amb?.encerrar(); });

describe('partidas', () => {
  let jogo;

  before(async () => {
    jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo partidas ${Date.now()}` }, token)).json;
    const nivel = await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    assert.equal(nivel.status, 201);
  });

  const criar = (jogada_em) => amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em }, token);

  it('jogada_em sem fuso responde 400 (seria gravada 3h deslocada no Render)', async () => {
    for (const jogada_em of ['2026-11-22T20:00', '2026-11-22T20:00:00', '22/11/2026']) {
      const r = await criar(jogada_em);
      assert.equal(r.status, 400, jogada_em);
    }
  });

  it('jogada_em com Z ou offset grava o instante correto', async () => {
    for (const jogada_em of ['2026-11-22T23:00:00.000Z', '2026-11-22T20:00:00-03:00']) {
      const r = await criar(jogada_em);
      assert.equal(r.status, 201, jogada_em);
      const p = await amb.req('GET', `/partida/listar/${r.json.id}`, undefined, token);
      assert.equal(new Date(p.json.jogada_em).toISOString(), '2026-11-22T23:00:00.000Z');
    }
  });

  it('atualizar valida jogada_em do mesmo jeito', async () => {
    const p = (await criar('2026-11-20T23:00:00Z')).json;
    const ruim = await amb.req('PUT', `/partida/atualizar/${p.id}`, { jogada_em: '2026-11-21T20:00' }, token);
    assert.equal(ruim.status, 400);
    const ok = await amb.req('PUT', `/partida/atualizar/${p.id}`, { jogada_em: '2026-11-21T20:00:00-03:00' }, token);
    assert.equal(ok.status, 200);
    assert.equal(new Date(ok.json.partida.jogada_em).toISOString(), '2026-11-21T23:00:00.000Z');
  });
});

describe('filtro de período de partidas (fuso do clube)', () => {
  let jogo;

  before(async () => {
    jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo período ${Date.now()}` }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    // 22h do dia 01 em Brasília = 01h do dia 02 em UTC.
    const r = await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em: '2026-11-01T22:00:00-03:00' }, token);
    assert.equal(r.status, 201);
  });

  const listar = (q) => amb.req('GET', `/partida/listar?id_jogo=${jogo.id}&${q}`, undefined, token);

  it('partida das 22h (BRT) do dia 01 aparece no filtro do dia 01, e não no do dia 02', async () => {
    const dia01 = await listar('jogada_em_inicio=2026-11-01&jogada_em_fim=2026-11-01');
    assert.equal(dia01.status, 200);
    assert.equal(dia01.json.length, 1);

    const dia02 = await listar('jogada_em_inicio=2026-11-02&jogada_em_fim=2026-11-02');
    assert.equal(dia02.json.length, 0);
  });

  it('cada limite funciona sozinho', async () => {
    assert.equal((await listar('jogada_em_fim=01/11/2026')).json.length, 1);
    assert.equal((await listar('jogada_em_inicio=02/11/2026')).json.length, 0);
  });

  it('limite inválido responde 400', async () => {
    assert.equal((await listar('jogada_em_inicio=2026-02-31')).status, 400);
  });
});

describe('remover partida', () => {
  it('remove partida com participantes junto com os resultados', async () => {
    const sufixo = Date.now();
    const jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo remover ${sufixo}` }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    const jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Remover ${sufixo}` }, token)).json;
    await amb.req('PUT', `/jogador-nivel/jogador/${jogador.id}/jogo/${jogo.id}`, { nivel: 1 }, token);
    const p = (await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em: '2026-11-21T22:00:00Z' }, token)).json;
    const part = await amb.req('POST', `/partida/${p.id}/jogador/${jogador.id}`, { posicao_final: 1 }, token);
    assert.equal(part.status, 201);

    const del = await amb.req('DELETE', `/partida/remover/${p.id}`, undefined, token);
    assert.equal(del.status, 200);

    assert.equal((await amb.req('GET', `/partida/listar/${p.id}`, undefined, token)).status, 404);
    const [linhas] = await amb.sequelize.query(
      'SELECT count(*)::int AS n FROM partida_resultado WHERE id_partida = :id',
      { replacements: { id: p.id } },
    );
    assert.equal(linhas[0].n, 0);
  });
});

describe('lista branca nas atualizações', () => {
  let jogo;
  let jogo2;
  let j1;
  let j2;
  let partida;

  before(async () => {
    const sufixo = Date.now();
    jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo LB ${sufixo}` }, token)).json;
    jogo2 = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo LB2 ${sufixo}` }, token)).json;
    for (const id of [jogo.id, jogo2.id]) {
      await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: id, nivel: 2 }, token);
    }
    j1 = (await amb.req('POST', '/jogador/registrar', { nome: `LB1 ${sufixo}` }, token)).json;
    j2 = (await amb.req('POST', '/jogador/registrar', { nome: `LB2 ${sufixo}` }, token)).json;
    await amb.req('PUT', `/jogador-nivel/jogador/${j1.id}/jogo/${jogo.id}`, { nivel: 2 }, token);
    partida = (await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 2, jogada_em: '2026-11-21T22:00:00Z' }, token)).json;
    await amb.req('POST', `/partida/${partida.id}/jogador/${j1.id}`, { posicao_final: 1 }, token);
  });

  const linhaPartida = async () => {
    const [[l]] = await amb.sequelize.query(
      'SELECT criado_em, criado_por, ativo, id_jogo, id_nivel_jogo FROM partida WHERE id = :id',
      { replacements: { id: partida.id } },
    );
    return l;
  };

  it('PUT de partida ignora criado_em, criado_por e ativo', async () => {
    const antes = await linhaPartida();
    const r = await amb.req('PUT', `/partida/atualizar/${partida.id}`, {
      criado_em: '2000-01-01T00:00:00Z', criado_por: null, ativo: false, id: 999999,
    }, token);
    assert.equal(r.status, 200);
    const depois = await linhaPartida();
    assert.equal(depois.criado_em.toISOString(), antes.criado_em.toISOString());
    assert.equal(depois.criado_por, antes.criado_por);
    assert.equal(depois.ativo, antes.ativo);
  });

  it('trocar o jogo de partida com participantes responde 409 e não altera nada', async () => {
    const r = await amb.req('PUT', `/partida/atualizar/${partida.id}`, { id_jogo: jogo2.id }, token);
    assert.equal(r.status, 409);
    assert.equal((await linhaPartida()).id_jogo, jogo.id);
  });

  it('trocar de jogo (sem participantes) sem nível leva o mesmo número de nível para o catálogo do novo jogo', async () => {
    const vazia = (await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 2, jogada_em: '2026-11-21T23:00:00Z' }, token)).json;
    const r = await amb.req('PUT', `/partida/atualizar/${vazia.id}`, { id_jogo: jogo2.id }, token);
    assert.equal(r.status, 200);
    const p = await amb.req('GET', `/partida/listar/${vazia.id}`, undefined, token);
    assert.equal(p.json.id_jogo, jogo2.id);
    assert.equal(p.json.nivelJogo.nivel, 2);
    const [[nivel]] = await amb.sequelize.query('SELECT id_jogo FROM nivel_jogo WHERE id = :id', { replacements: { id: p.json.id_nivel_jogo } });
    assert.equal(nivel.id_jogo, jogo2.id);
  });

  it('PUT de participante não troca o jogador nem a partida', async () => {
    const r = await amb.req('PUT', `/partida/${partida.id}/jogador/${j1.id}`, {
      id_jogador: j2.id, id_partida: 999999, posicao_final: 2,
    }, token);
    assert.equal(r.status, 200);
    assert.equal(r.json.participante.id_jogador, j1.id);
    assert.equal(r.json.participante.id_partida, partida.id);
    assert.equal(r.json.participante.posicao_final, 2);
  });

  it('PUT de participante valida posicao_final e vencedor', async () => {
    assert.equal((await amb.req('PUT', `/partida/${partida.id}/jogador/${j1.id}`, { posicao_final: 0 }, token)).status, 400);
    assert.equal((await amb.req('PUT', `/partida/${partida.id}/jogador/${j1.id}`, { vencedor: 'sim' }, token)).status, 400);
  });
});

describe('histórico de partidas por jogador', () => {
  let jogo;
  let ana;
  let bia;
  let caio;
  let comAna;
  let semAna;

  before(async () => {
    const sufixo = Date.now();
    jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo histórico ${sufixo}` }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    const jogadores = [];
    for (const nome of ['Ana', 'Bia', 'Caio']) {
      const j = (await amb.req('POST', '/jogador/registrar', { nome: `${nome} ${sufixo}` }, token)).json;
      await amb.req('PUT', `/jogador-nivel/jogador/${j.id}/jogo/${jogo.id}`, { nivel: 1 }, token);
      jogadores.push(j);
    }
    [ana, bia, caio] = jogadores;
    const nova = async () => (await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em: '2026-10-10T22:00:00Z' }, token)).json;
    comAna = await nova();
    semAna = await nova();
    await amb.req('POST', `/partida/${comAna.id}/jogador/${ana.id}`, { posicao_final: 2 }, token);
    await amb.req('POST', `/partida/${comAna.id}/jogador/${bia.id}`, { posicao_final: 1, vencedor: true }, token);
    await amb.req('POST', `/partida/${semAna.id}/jogador/${bia.id}`, { posicao_final: 1, vencedor: true }, token);
  });

  it('lista só as partidas do jogador, com vencedor e total da partida inteira', async () => {
    const r = await amb.req('GET', `/partida/listar?id_jogador=${ana.id}`, undefined, token);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.map((p) => p.id), [comAna.id]);
    assert.equal(r.json[0].total_jogadores, 2);
    assert.equal(r.json[0].vencedor, bia.nome);
  });

  it('combina com os outros filtros e devolve vazio para quem não jogou', async () => {
    const comJogo = await amb.req('GET', `/partida/listar?id_jogador=${bia.id}&id_jogo=${jogo.id}`, undefined, token);
    assert.deepEqual(comJogo.json.map((p) => p.id).sort(), [comAna.id, semAna.id].sort());
    const foraDoPeriodo = await amb.req('GET', `/partida/listar?id_jogador=${bia.id}&jogada_em_inicio=2026-10-11`, undefined, token);
    assert.equal(foraDoPeriodo.json.length, 0);
    const semPartidas = await amb.req('GET', `/partida/listar?id_jogador=${caio.id}`, undefined, token);
    assert.deepEqual(semPartidas.json, []);
  });

  it('id_jogador inválido responde 400', async () => {
    for (const q of ['abc', '0', '1.5']) {
      assert.equal((await amb.req('GET', `/partida/listar?id_jogador=${q}`, undefined, token)).status, 400, q);
    }
    const repetido = await amb.req('GET', `/partida/listar?id_jogador=${ana.id}&id_jogador=${bia.id}`, undefined, token);
    assert.equal(repetido.status, 400);
  });
});
