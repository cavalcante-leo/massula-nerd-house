const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const path = require('path');
const { problemaNoSegredoJwt } = require('../src/api/config/jwt');

describe('JWT_SECRET forte em produção', () => {
  it('em produção recusa placeholder e segredo curto; aceita segredo longo', () => {
    assert.match(problemaNoSegredoJwt('troque-por-um-segredo-longo-e-aleatorio', 'production'), /placeholder/);
    assert.match(problemaNoSegredoJwt('curto', 'production'), /32 caracteres/);
    assert.equal(problemaNoSegredoJwt('x'.repeat(32), 'production'), null);
  });

  it('em development/test só exige que exista', () => {
    assert.equal(problemaNoSegredoJwt('curto', 'development'), null);
    assert.equal(problemaNoSegredoJwt('curto', 'test'), null);
    assert.match(problemaNoSegredoJwt('', 'development'), /não definido/);
  });

  it('sem NODE_ENV (esquecido no deploy) a regra forte vale', () => {
    assert.match(problemaNoSegredoJwt('curto', undefined), /32 caracteres/);
  });

  it('o boot sai com erro em produção com segredo fraco, antes de tocar no banco', () => {
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'api', 'server.js')], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        JWT_SECRET: 'curto',
        // Host inexistente: se o boot chegasse a conectar, o teste demoraria/falharia de outro jeito.
        DATABASE_URL: 'postgresql://u:p@127.0.0.1:1/inexistente',
      },
      encoding: 'utf8',
      timeout: 15000,
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /JWT_SECRET precisa ter pelo menos 32 caracteres/);
  });
});
