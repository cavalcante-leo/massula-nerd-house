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
