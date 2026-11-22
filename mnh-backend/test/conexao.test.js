const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { conectarComRetentativas } = require('../src/api/config/conexao');

const sequelizeFalso = (falhasAntesDoSucesso) => {
  let chamadas = 0;
  return {
    get chamadas() { return chamadas; },
    authenticate: async () => {
      chamadas += 1;
      if (chamadas <= falhasAntesDoSucesso) throw new Error(`timeout expired #${chamadas}`);
    },
  };
};

describe('conectarComRetentativas', () => {
  it('conecta na primeira sem esperar', async () => {
    const esperas = [];
    const s = sequelizeFalso(0);
    const tentativa = await conectarComRetentativas(s, { dormir: async (ms) => { esperas.push(ms); } });
    assert.equal(tentativa, 1);
    assert.deepEqual(esperas, []);
  });

  it('falha transitória: tenta de novo com backoff exponencial', async () => {
    const esperas = [];
    const s = sequelizeFalso(2);
    const tentativa = await conectarComRetentativas(s, { dormir: async (ms) => { esperas.push(ms); } });
    assert.equal(tentativa, 3);
    assert.deepEqual(esperas, [2000, 4000]);
  });

  it('esgotadas as tentativas, lança o último erro', async () => {
    const s = sequelizeFalso(99);
    await assert.rejects(
      conectarComRetentativas(s, { tentativas: 3, dormir: async () => {} }),
      /timeout expired #3/,
    );
    assert.equal(s.chamadas, 3);
  });
});
