const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

describe('registro de presença', () => {
  let amb;
  let token;
  let jogador;

  before(async () => {
    amb = await prepararAmbiente();
    token = amb.tokenSuperadmin();
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Presença ${Date.now()}` }, token)).json;
  });
  after(async () => { await amb?.encerrar(); });

  for (const rota of ['/jogador/registrarPresenca', '/presenca/registrar']) {
    it(`${rota}: erros de validação não prendem conexões do pool`, async () => {
      // O pool tem 5 conexões; antes da correção, a 6ª requisição derrubava o processo.
      for (let i = 0; i < 8; i += 1) {
        const r = await amb.req('POST', `${rota}/${jogador.id}`, { data: 'data-invalida' }, token);
        assert.equal(r.status, 400);
      }
      const futura = await amb.req('POST', `${rota}/${jogador.id}`, { data: '01/01/2999' }, token);
      assert.equal(futura.status, 400);

      const lista = await amb.req('GET', '/jogador/listar', undefined, token);
      assert.equal(lista.status, 200);
    });

    it(`${rota}: jogador inexistente responde 404 sem prender conexão`, async () => {
      for (let i = 0; i < 6; i += 1) {
        const r = await amb.req('POST', `${rota}/999999`, { data: '01/01/2026' }, token);
        assert.equal(r.status, 404);
      }
    });
  }

  it('/jogador/registrarPresenca registra, devolve patente e rejeita duplicada', async () => {
    const r = await amb.req('POST', `/jogador/registrarPresenca/${jogador.id}`, { data: '10/11/2026' }, token);
    assert.equal(r.status, 200);
    assert.equal(r.json.jogador.presencas_total, 1);
    assert.equal(r.json.jogador.data_presenca, '10/11/2026');

    const [linhas] = await amb.sequelize.query(
      'SELECT data_presenca::text AS dia FROM jogador_presenca WHERE id_jogador = :id',
      { replacements: { id: jogador.id } },
    );
    assert.deepEqual(linhas.map((l) => l.dia), ['2026-11-10']);

    const dup = await amb.req('POST', `/jogador/registrarPresenca/${jogador.id}`, { data: '10/11/2026' }, token);
    assert.equal(dup.status, 409);
  });

  it('/presenca/registrar registra com 201 e rejeita duplicada', async () => {
    const r = await amb.req('POST', `/presenca/registrar/${jogador.id}`, { data: '11/11/2026' }, token);
    assert.equal(r.status, 201);
    assert.equal(r.json.jogador.id, jogador.id);

    const dup = await amb.req('POST', `/presenca/registrar/${jogador.id}`, { data: '11/11/2026' }, token);
    assert.equal(dup.status, 409);
  });

  it('listar filtra pelo dia exato, em dd/mm/aaaa ou AAAA-MM-DD', async () => {
    for (const [inicio, fim] of [['2026-11-11', '2026-11-11'], ['11/11/2026', '11/11/2026']]) {
      const r = await amb.req('GET', `/presenca/listar?inicio=${inicio}&fim=${fim}`, undefined, token);
      assert.equal(r.status, 200);
      const doJogador = r.json.filter((p) => p.id_jogador === jogador.id);
      assert.deepEqual(doJogador.map((p) => p.data_presenca), ['2026-11-11']);
    }
    const invalida = await amb.req('GET', '/presenca/listar?inicio=2026-02-31', undefined, token);
    assert.equal(invalida.status, 400);
  });

  it('registros simultâneos no mesmo dia: um 2xx e o resto 409, nunca 500', async () => {
    const respostas = await Promise.all(Array.from({ length: 4 }, () => (
      amb.req('POST', `/presenca/registrar/${jogador.id}`, { data: '12/11/2026' }, token)
    )));
    const status = respostas.map((r) => r.status).sort();
    assert.deepEqual(status, [201, 409, 409, 409]);
  });
});
