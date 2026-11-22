const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

let amb;
let tokenSuper;
before(async () => {
  amb = await prepararAmbiente();
  tokenSuper = amb.tokenSuperadmin();
});
after(async () => { await amb?.encerrar(); });

describe('auth: usuário conferido no banco a cada requisição', () => {
  const criarAdmin = async () => {
    const sufixo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const r = await amb.req('POST', '/usuario/registrar', {
      nome: `Admin ${sufixo}`, nome_usuario: `admin_${sufixo}`, senha: 'senha-de-teste-123',
    }, tokenSuper);
    assert.equal(r.status, 201);
    return r.json;
  };

  it('token de admin desativado deixa de valer na hora (401)', async () => {
    const admin = await criarAdmin();
    const token = amb.tokenPara(admin);
    assert.equal((await amb.req('GET', '/jogador/listar', undefined, token)).status, 200);

    assert.equal((await amb.req('PUT', `/usuario/desativar/${admin.id}`, undefined, tokenSuper)).status, 200);

    assert.equal((await amb.req('GET', '/jogador/listar', undefined, token)).status, 401);
    assert.equal((await amb.req('POST', '/jogador/registrar', { nome: 'Fantasma' }, token)).status, 401);
  });

  it('papel vem do banco: token que diz superadmin para um admin não passa em rota de superadmin', async () => {
    const admin = await criarAdmin();
    const tokenForjadoComPapel = amb.tokenPara({ id: admin.id, tipo: 'superadmin' });
    const r = await amb.req('GET', '/usuario/listar', undefined, tokenForjadoComPapel);
    assert.equal(r.status, 403);
  });

  it('token de usuário inexistente responde 401', async () => {
    const r = await amb.req('GET', '/jogador/listar', undefined, amb.tokenPara({ id: 999999, tipo: 'superadmin' }));
    assert.equal(r.status, 401);
  });

  it('token assinado com outro segredo responde 401', async () => {
    const jwt = require('jsonwebtoken');
    const falso = jwt.sign({ id: 1, tipo: 'superadmin' }, 'outro-segredo');
    assert.equal((await amb.req('GET', '/jogador/listar', undefined, falso)).status, 401);
  });
});
