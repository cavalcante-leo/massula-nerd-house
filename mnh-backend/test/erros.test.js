const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');
const { ErroDominio, responderErro } = require('../src/helpers/erros');

const resFalso = () => {
  const r = { statusCode: null, corpo: null };
  r.status = (s) => { r.statusCode = s; return r; };
  r.json = (c) => { r.corpo = c; return r; };
  return r;
};

describe('responderErro (unitário)', () => {
  it('ErroDominio vira o status e a mensagem dele', () => {
    const res = resFalso();
    responderErro(res, new ErroDominio(404, 'Partida não encontrada.'), 'Erro ao buscar partida.');
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.corpo, { erro: 'Partida não encontrada.' });
  });

  it('erro inesperado responde 500 genérico, sem err.message', (t) => {
    t.mock.method(console, 'error', () => {});
    const res = resFalso();
    responderErro(res, new Error('relation "partida" violates constraint xyz'), 'Erro ao buscar partida.');
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.corpo, { erro: 'Erro ao buscar partida.' });
  });
});

let amb;
let token;
before(async () => {
  amb = await prepararAmbiente();
  token = amb.tokenSuperadmin();
});
after(async () => { await amb?.encerrar(); });

describe('status corretos na API', () => {
  let partida;
  let jogador;

  before(async () => {
    const sufixo = Date.now();
    const jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Erros ${sufixo}` }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Erros ${sufixo}` }, token)).json;
    await amb.req('PUT', `/jogador-nivel/jogador/${jogador.id}/jogo/${jogo.id}`, { nivel: 1 }, token);
    partida = (await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em: '2026-11-21T22:00:00Z' }, token)).json;
  });

  const semVazamento = (r) => {
    const texto = JSON.stringify(r.json);
    assert.ok(!/Sequelize|invalid input syntax|constraint|codigo/i.test(texto), texto);
  };

  it('ids de rota inválidos respondem 400 (antes: 500 do Postgres)', async () => {
    for (const url of ['/jogador/listar/abc', '/jogador/listar/0', '/jogador/listar/1.5', '/jogo/listar/99999999999', '/nivel-jogo/abc']) {
      const r = await amb.req('GET', url, undefined, token);
      assert.equal(r.status, 400, url);
      semVazamento(r);
    }
    const participante = await amb.req('PUT', `/partida/${partida.id}/jogador/abc`, { posicao_final: 1 }, token);
    assert.equal(participante.status, 400);
  });

  it('ids inválidos em query e corpo de partida respondem 400', async () => {
    assert.equal((await amb.req('GET', '/partida/listar?id_jogo=abc', undefined, token)).status, 400);
    assert.equal((await amb.req('POST', '/partida/registrar', { id_jogo: 'abc', nivel: 1, jogada_em: '2026-11-21T22:00:00Z' }, token)).status, 400);
    assert.equal((await amb.req('POST', '/partida/registrar', { id_jogo: 1, nivel: 'x', jogada_em: '2026-11-21T22:00:00Z' }, token)).status, 400);
    assert.equal((await amb.req('PUT', `/partida/atualizar/${partida.id}`, { id_jogo: 'abc' }, token)).status, 400);
  });

  it('recursos inexistentes respondem 404 (antes: 500)', async () => {
    const casos = [
      ['PUT', '/partida/atualizar/999999', { nivel: 1 }],
      ['DELETE', '/partida/remover/999999'],
      ['PUT', `/partida/${partida.id}/jogador/999999`, { posicao_final: 2 }],
      ['DELETE', `/partida/${partida.id}/jogador/999999`],
      ['POST', '/partida/registrar', { id_jogo: 999999, nivel: 1, jogada_em: '2026-11-21T22:00:00Z' }],
    ];
    for (const [metodo, url, corpo] of casos) {
      const r = await amb.req(metodo, url, corpo, token);
      assert.equal(r.status, 404, `${metodo} ${url}`);
      semVazamento(r);
    }
  });

  it('jogador repetido na partida responde 409', async () => {
    assert.equal((await amb.req('POST', `/partida/${partida.id}/jogador/${jogador.id}`, {}, token)).status, 201);
    const dup = await amb.req('POST', `/partida/${partida.id}/jogador/${jogador.id}`, {}, token);
    assert.equal(dup.status, 409);
  });
});
