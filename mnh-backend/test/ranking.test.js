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

describe('ranking geral', () => {
  const sufixo = Date.now();
  let jogo;
  let outroJogo;
  const j = {};

  const novoJogo = async (nome) => {
    const jogoNovo = (await amb.req('POST', '/jogo/registrar', { nome }, token)).json;
    await amb.req('POST', '/nivel-jogo/registrar', { id_jogo: jogoNovo.id, nivel: 1 }, token);
    return jogoNovo;
  };
  // vencedor: nome do jogador que venceu; demais só participaram. Como o frontend, o POST
  // manda só posicao_final, e a API marca vencedor quem fica em 1º.
  const partida = async (id_jogo, jogada_em, vencedor, ...outros) => {
    const p = (await amb.req('POST', '/partida/registrar', { id_jogo, nivel: 1, jogada_em }, token)).json;
    for (const [i, nome] of [vencedor, ...outros].entries()) {
      const r = await amb.req('POST', `/partida/${p.id}/jogador/${j[nome].id}`, { posicao_final: i + 1 }, token);
      assert.equal(r.status, 201);
      assert.equal(r.json.vencedor, i === 0);
    }
  };

  before(async () => {
    jogo = await novoJogo(`Ranking ${sufixo}`);
    outroJogo = await novoJogo(`Ranking outro ${sufixo}`);
    for (const nome of ['Ana', 'Bia', 'Caio', 'Duda']) {
      j[nome] = (await amb.req('POST', '/jogador/registrar', { nome: `${nome} ${sufixo}` }, token)).json;
      for (const g of [jogo, outroJogo]) {
        await amb.req('PUT', `/jogador-nivel/jogador/${j[nome].id}/jogo/${g.id}`, { nivel: 1 }, token);
      }
    }
    // 22h do dia 01/07 em Brasília = 01h do dia 02 em UTC.
    await partida(jogo.id, '2026-07-01T22:00:00-03:00', 'Ana', 'Bia');
    await partida(jogo.id, '2026-07-02T20:00:00-03:00', 'Ana', 'Caio');
    await partida(jogo.id, '2026-07-03T20:00:00-03:00', 'Bia', 'Ana');
    await partida(jogo.id, '2026-07-03T21:00:00-03:00', 'Caio', 'Duda');
    // Partida sem participantes não conta para ninguém.
    await amb.req('POST', '/partida/registrar', { id_jogo: jogo.id, nivel: 1, jogada_em: '2026-07-04T20:00:00Z' }, token);
    // Outro jogo: Duda vence, não pode aparecer no filtro do primeiro jogo.
    await partida(outroJogo.id, '2026-07-05T20:00:00Z', 'Duda', 'Ana');
  });

  const ranking = (q) => amb.req('GET', `/ranking?${q}`, undefined, token);
  const resumo = (linhas) => linhas.map((l) => [l.posicao, l.nome.split(' ')[0], l.vitorias, l.partidas, l.percentual_vitorias]);

  it('ordena por vitórias e depois por %, com empate dividindo a posição', async () => {
    const r = await ranking(`id_jogo=${jogo.id}`);
    assert.equal(r.status, 200);
    assert.deepEqual(resumo(r.json), [
      [1, 'Ana', 2, 3, 66.7],
      [2, 'Bia', 1, 2, 50],
      [2, 'Caio', 1, 2, 50],
      [4, 'Duda', 0, 1, 0],
    ]);
    assert.deepEqual(Object.keys(r.json[0]).sort(), ['ativo', 'id_jogador', 'nome', 'partidas', 'percentual_vitorias', 'posicao', 'vitorias']);
  });

  it('período no fuso do clube: a partida das 22h do dia 01 conta no dia 01', async () => {
    const r = await ranking(`id_jogo=${jogo.id}&inicio=01/07/2026&fim=2026-07-01`);
    assert.deepEqual(resumo(r.json), [[1, 'Ana', 1, 1, 100], [2, 'Bia', 0, 1, 0]]);
  });

  it('sem id_jogo soma todos os jogos', async () => {
    const r = await ranking('inicio=2026-07-01&fim=2026-07-31');
    const meus = r.json.filter((l) => l.nome.endsWith(String(sufixo)));
    const duda = meus.find((l) => l.id_jogador === j.Duda.id);
    assert.deepEqual([duda.vitorias, duda.partidas], [1, 2]);
    const ana = meus.find((l) => l.id_jogador === j.Ana.id);
    assert.deepEqual([ana.vitorias, ana.partidas], [2, 4]);
  });

  it('jogador desativado continua no ranking com ativo=false', async () => {
    await amb.req('PUT', `/jogador/desativar/${j.Duda.id}`, undefined, token);
    const r = await ranking(`id_jogo=${jogo.id}`);
    const duda = r.json.find((l) => l.id_jogador === j.Duda.id);
    assert.equal(duda.ativo, false);
  });

  it('filtros inválidos respondem 400 e sem token 401', async () => {
    for (const q of ['id_jogo=abc', 'id_jogo=0', 'inicio=2026-02-31', 'fim=31/02/2026']) {
      assert.equal((await ranking(q)).status, 400, q);
    }
    assert.equal((await amb.req('GET', '/ranking')).status, 401);
  });

  it('jogo sem partidas devolve lista vazia', async () => {
    const vazio = await novoJogo(`Ranking vazio ${sufixo}`);
    assert.deepEqual((await ranking(`id_jogo=${vazio.id}`)).json, []);
  });
});
