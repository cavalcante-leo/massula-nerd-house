const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

describe('smoke', () => {
  let amb;
  before(async () => { amb = await prepararAmbiente(); });
  after(async () => { await amb?.encerrar(); });

  it('health responde sem banco', async () => {
    const r = await amb.req('GET', '/health');
    assert.equal(r.status, 200);
  });

  it('login pela rota devolve token aceito nas rotas protegidas', async () => {
    const login = await amb.req('POST', '/auth/login', amb.credenciaisSuperadmin);
    assert.equal(login.status, 200);
    const r = await amb.req('GET', '/jogador/listar', undefined, login.json.accessToken);
    assert.equal(r.status, 200);
  });

  it('token gerado pelo helper é aceito', async () => {
    const r = await amb.req('GET', '/jogador/listar', undefined, amb.tokenSuperadmin());
    assert.equal(r.status, 200);
  });

  it('rota protegida sem token responde 401', async () => {
    const r = await amb.req('GET', '/jogador/listar');
    assert.equal(r.status, 401);
  });
});
