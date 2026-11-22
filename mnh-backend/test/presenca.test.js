const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prepararAmbiente } = require('./helpers/ambiente');

// Um ambiente por arquivo (ver helpers/ambiente.js).
let amb;
let token;
before(async () => {
  amb = await prepararAmbiente();
  token = amb.tokenSuperadmin();
});
after(async () => { await amb?.encerrar(); });

describe('registro de presença', () => {
  let jogador;

  before(async () => {
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Presença ${Date.now()}` }, token)).json;
  });

  for (const rota of ['/jogador/registrarPresenca', '/presenca/registrar']) {
    it(`${rota}: erros de validação não prendem conexões do pool`, async () => {
      // O pool tem 5 conexões; antes da correção, a 6ª requisição derrubava o processo.
      for (let i = 0; i < 8; i += 1) {
        const r = await amb.req('POST', `${rota}/${jogador.id}`, { data: 'data-invalida' }, token);
        assert.equal(r.status, 400);
      }
      const futura = await amb.req('POST', `${rota}/${jogador.id}`, { data: '01/01/2999' }, token);
      assert.equal(futura.status, 400);
      const inexistente = await amb.req('POST', `${rota}/${jogador.id}`, { data: '31/02/2026' }, token);
      assert.equal(inexistente.status, 400);
      const naoString = await amb.req('POST', `${rota}/${jogador.id}`, { data: 20261110 }, token);
      assert.equal(naoString.status, 400);

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

describe('presenças inativas (removidas) não contam', () => {
  let jogador;

  before(async () => {
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Inativas ${Date.now()}` }, token)).json;
    for (const data of ['01/10/2026', '02/10/2026']) {
      assert.equal((await amb.req('POST', `/presenca/registrar/${jogador.id}`, { data }, token)).status, 201);
    }
    await amb.sequelize.query(
      "UPDATE jogador_presenca SET ativo = false WHERE id_jogador = :id AND data_presenca = '2026-10-02'",
      { replacements: { id: jogador.id } },
    );
  });

  it('total e patente consideram só as ativas (lista e detalhe)', async () => {
    const lista = (await amb.req('GET', '/jogador/listar', undefined, token)).json;
    assert.equal(lista.find((j) => j.id === jogador.id).total_presencas, 1);
    const detalhe = (await amb.req('GET', `/jogador/listar/${jogador.id}`, undefined, token)).json;
    assert.equal(detalhe.total_presencas, 1);
  });

  it('listar presenças não mostra a removida', async () => {
    const r = (await amb.req('GET', '/presenca/listar?inicio=2026-10-01&fim=2026-10-31', undefined, token)).json;
    assert.deepEqual(r.filter((p) => p.id_jogador === jogador.id).map((p) => p.data_presenca), ['2026-10-01']);
  });

  it('registrar de novo no dia removido reativa a mesma linha', async () => {
    const [[antes]] = await amb.sequelize.query(
      "SELECT id FROM jogador_presenca WHERE id_jogador = :id AND data_presenca = '2026-10-02'",
      { replacements: { id: jogador.id } },
    );
    const r = await amb.req('POST', `/jogador/registrarPresenca/${jogador.id}`, { data: '02/10/2026' }, token);
    assert.equal(r.status, 200);
    assert.equal(r.json.jogador.presencas_total, 2);
    const [linhas] = await amb.sequelize.query(
      "SELECT id, ativo FROM jogador_presenca WHERE id_jogador = :id AND data_presenca = '2026-10-02'",
      { replacements: { id: jogador.id } },
    );
    assert.deepEqual(linhas, [{ id: antes.id, ativo: true }]);

    const dup = await amb.req('POST', `/jogador/registrarPresenca/${jogador.id}`, { data: '02/10/2026' }, token);
    assert.equal(dup.status, 409);
  });
});

describe('remover presença (soft delete)', () => {
  let jogador;
  let presenca;

  before(async () => {
    jogador = (await amb.req('POST', '/jogador/registrar', { nome: `Remover ${Date.now()}` }, token)).json;
    for (const data of ['05/09/2026', '06/09/2026']) {
      const r = await amb.req('POST', `/presenca/registrar/${jogador.id}`, { data }, token);
      assert.equal(r.status, 201);
      if (data === '06/09/2026') presenca = r.json.presenca;
    }
  });

  it('marca ativo=false, grava atualizado_por e devolve o novo total', async () => {
    const r = await amb.req('DELETE', `/presenca/remover/${presenca.id}`, undefined, token);
    assert.equal(r.status, 200);
    assert.equal(r.json.id, presenca.id);
    assert.equal(r.json.presencas_total, 1);
    assert.equal(r.json.patente, 1);

    const [[linha]] = await amb.sequelize.query(
      'SELECT ativo, atualizado_por FROM jogador_presenca WHERE id = :id',
      { replacements: { id: presenca.id } },
    );
    assert.equal(linha.ativo, false);
    assert.ok(linha.atualizado_por, 'atualizado_por preenchido');

    const detalhe = (await amb.req('GET', `/jogador/listar/${jogador.id}`, undefined, token)).json;
    assert.equal(detalhe.total_presencas, 1);
  });

  it('remover de novo, id inexistente ou inválido não dá 500', async () => {
    assert.equal((await amb.req('DELETE', `/presenca/remover/${presenca.id}`, undefined, token)).status, 404);
    assert.equal((await amb.req('DELETE', '/presenca/remover/999999', undefined, token)).status, 404);
    assert.equal((await amb.req('DELETE', '/presenca/remover/abc', undefined, token)).status, 400);
  });

  it('exige autenticação', async () => {
    assert.equal((await amb.req('DELETE', `/presenca/remover/${presenca.id}`)).status, 401);
  });

  it('registrar o dia removido reativa a mesma linha', async () => {
    const r = await amb.req('POST', `/presenca/registrar/${jogador.id}`, { data: '06/09/2026' }, token);
    assert.equal(r.status, 201);
    assert.equal(r.json.presenca.id, presenca.id);
  });
});
