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
    // O catálogo é do superadmin: os níveis precisam existir antes de serem atribuídos.
    for (const nivel of [1, 3, 4, 5, 6]) {
      await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogoA.id, nivel }, token);
    }
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogoB.id, nivel: 2 }, token);
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

describe('catálogo de níveis é só do superadmin', () => {
  let jogo;
  let jogador;
  let tokenAdmin;

  before(async () => {
    const sufixo = Date.now();
    jogo = (await amb.req('POST', '/jogo/registrar', { nome: `Catálogo ${sufixo}` }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 1 }, token);
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Catálogo ${sufixo}` }, token)).json;
    const admin = (await amb.req('POST', '/usuario/registrar', {
      nome: `Admin cat ${sufixo}`, nome_usuario: `admin_cat_${sufixo}`, senha: 'senha-de-teste-123',
    }, token)).json;
    tokenAdmin = amb.tokenPara(admin);
  });

  const catalogo = async () => (await amb.req('GET', `/nivel-jogo/jogo/${jogo.id}`, undefined, token)).json
    .map((n) => `${n.nivel}:${n.ativo}`);

  it('admin comum não cria nível no catálogo ao criar partida (400)', async () => {
    const r = await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 7, jogada_em: '2026-11-20T23:00:00Z' }, tokenAdmin);
    assert.equal(r.status, 400);
    assert.match(r.json.erro, /Nível 7 não está cadastrado/);
    assert.deepEqual(await catalogo(), ['1:true']);
  });

  it('definir nível fora do catálogo responde 400 e não cria o nível', async () => {
    const r = await amb.req('PUT', `/jogador-nivel/jogador/${jogador.id}/jogo/${jogo.id}`, { nivel: 9 }, tokenAdmin);
    assert.equal(r.status, 400);
    assert.deepEqual(await catalogo(), ['1:true']);
  });

  it('nível desativado não é reativado por partida nem por definir nível', async () => {
    const n5 = (await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogo.id, nivel: 5 }, token)).json;
    assert.equal((await amb.req('PUT', `/nivel-jogo/desativar/${n5.id}`, undefined, token)).status, 200);

    const p = await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 5, jogada_em: '2026-11-20T23:00:00Z' }, tokenAdmin);
    assert.equal(p.status, 400);
    const d = await amb.req('PUT', `/jogador-nivel/jogador/${jogador.id}/jogo/${jogo.id}`, { nivel: 5 }, tokenAdmin);
    assert.equal(d.status, 400);
    assert.deepEqual((await catalogo()).sort(), ['1:true', '5:false']);
  });

  it('partida em jogo desativado responde 400', async () => {
    const outro = (await amb.req('POST', '/jogo/registrar', { nome: `Desativado ${Date.now()}` }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: outro.id, nivel: 1 }, token);
    assert.equal((await amb.req('PUT', `/jogo/desativar/${outro.id}`, undefined, token)).status, 200);
    const r = await amb.req('POST', '/partida/registrar', { id_jogo: outro.id, nivel: 1, jogada_em: '2026-11-20T23:00:00Z' }, tokenAdmin);
    assert.equal(r.status, 400);
    assert.match(r.json.erro, /Jogo desativado/);
  });

  it('nível do catálogo funciona normalmente para admin comum', async () => {
    const r = await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em: '2026-11-20T23:00:00Z' }, tokenAdmin);
    assert.equal(r.status, 201);
  });
});
