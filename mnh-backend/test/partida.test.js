const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

describe('partidas', () => {
  let amb;
  let token;
  let jogo;

  before(async () => {
    amb = await prepararAmbiente();
    token = amb.tokenSuperadmin();
    jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Jogo partidas ${Date.now()}` }, token)).json;
    const nivel = await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    assert.equal(nivel.status, 201);
  });
  after(async () => { await amb?.encerrar(); });

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
