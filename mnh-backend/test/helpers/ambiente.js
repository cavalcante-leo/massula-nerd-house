// Ambiente de cada arquivo de teste: sobe o app numa porta efêmera, ligado ao banco
// descartável que o `test/executar.js` (npm test) criou e migrou.
const { garantirHostLocal } = require('./hostLocal');

const criarRequisicao = (base) => async (method, url, body, token) => {
  const r = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await r.json(); } catch { /* sem corpo */ }
  return { status: r.status, json };
};

/**
 * Use em `before`, e chame `encerrar()` no `after`.
 * Os tokens são gerados direto (sem passar pela rota de login e seu rate limit).
 */
const prepararAmbiente = async () => {
  const { TEST_DATABASE_URL, TEST_SUPERADMIN_ID } = process.env;
  if (!TEST_DATABASE_URL || !TEST_SUPERADMIN_ID) {
    throw new Error('Rode os testes com `npm test`: ele cria o banco descartável e define o ambiente.');
  }
  garantirHostLocal(TEST_DATABASE_URL, 'TEST_DATABASE_URL');
  // Garante que o app use o banco de teste mesmo que o shell tenha outro DATABASE_URL.
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  const sequelize = require('../../src/api/config/database');
  sequelize.options.logging = false;
  const app = require('../../src/api/app');
  const { gerarAccessToken } = require('../../src/api/config/jwt');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const tokenPara = (usuario) => gerarAccessToken(usuario.id, usuario.tipo);
  const superadmin = { id: Number(TEST_SUPERADMIN_ID), tipo: 'superadmin' };

  const encerrar = async () => {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  };

  return {
    base,
    req: criarRequisicao(base),
    sequelize,
    tokenPara,
    tokenSuperadmin: () => tokenPara(superadmin),
    credenciaisSuperadmin: {
      nome: process.env.TEST_SUPERADMIN_USUARIO,
      senha: process.env.TEST_SUPERADMIN_SENHA,
    },
    encerrar,
  };
};

module.exports = { prepararAmbiente };
