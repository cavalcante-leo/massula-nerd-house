const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

let amb;
let token;
before(async () => {
  amb = await prepararAmbiente();
  token = amb.tokenSuperadmin();
});
after(async () => { await amb?.encerrar(); });

describe('nível do jogador por jogo', () => {
  let jogoA;
  let jogoB;
  let jogador;

  before(async () => {
    const sufixo = Date.now();
    jogoA = (await amb.req('POST', '/jogo/registrar', { nome: `Nível A ${sufixo}` }, token)).json;
    jogoB = (await amb.req('POST', '/jogo/registrar', { nome: `Nível B ${sufixo}` }, token)).json;
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Jogador nível ${sufixo}` }, token)).json;
  });

  const definir = (idJogo, nivel) => amb.req('PUT', `/jogador-nivel/jogador/${jogador.id}/jogo/${idJogo}`, { nivel }, token);
  const niveisDoJogador = async () => (await amb.req('GET', `/jogador-nivel/jogador/${jogador.id}`, undefined, token)).json;

  it('definir de novo substitui o nível no mesmo jogo, sem acumular', async () => {
    assert.equal((await definir(jogoA.id, 1)).status, 200);
    assert.equal((await definir(jogoA.id, 3)).status, 200);

    const doJogoA = (await niveisDoJogador()).filter((v) => v.nivelJogo.id_jogo === jogoA.id);
    assert.deepEqual(doJogoA.map((v) => v.nivelJogo.nivel), [3]);

    const atual = await amb.req('GET', `/jogador-nivel/jogador/${jogador.id}/jogo/${jogoA.id}`, undefined, token);
    assert.equal(atual.json.nivelJogo.nivel, 3);
  });

  it('redefinir o mesmo nível é idempotente', async () => {
    const antes = (await definir(jogoA.id, 3)).json.nivel.id;
    const depois = (await definir(jogoA.id, 3)).json.nivel.id;
    assert.equal(antes, depois);
  });

  it('nível em outro jogo não mexe no primeiro', async () => {
    await definir(jogoB.id, 2);
    const niveis = (await niveisDoJogador()).map((v) => `${v.nivelJogo.id_jogo}:${v.nivelJogo.nivel}`).sort();
    assert.deepEqual(niveis, [`${jogoA.id}:3`, `${jogoB.id}:2`].sort());
  });

  it('definições simultâneas terminam com um único nível no jogo', async () => {
    const respostas = await Promise.all([4, 5, 6].map((n) => definir(jogoA.id, n)));
    assert.ok(respostas.every((r) => r.status === 200), respostas.map((r) => r.status).join(','));
    const doJogoA = (await niveisDoJogador()).filter((v) => v.nivelJogo.id_jogo === jogoA.id);
    assert.equal(doJogoA.length, 1);
  });
});
