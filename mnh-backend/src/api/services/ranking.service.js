const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Ranking geral: vitórias (`vencedor = true`), partidas jogadas e % de vitórias por jogador.
 * Só entra quem jogou ao menos uma partida no recorte. Ordena por vitórias e depois por %;
 * empate nos dois divide a posição (RANK). Jogadores desativados continuam no ranking, com
 * `ativo: false`, porque o histórico deles é real; o frontend decide se esconde.
 *
 * `filtros.id_jogo`: opcional. `periodo`: `{ desde, ateExclusivo }` de `intervaloDoPeriodo`.
 */
const obterRankingGeral = async ({ id_jogo = null } = {}, periodo = null) => {
  const condicoes = ['p.ativo = true'];
  const replacements = {};
  if (id_jogo) {
    condicoes.push('p.id_jogo = :id_jogo');
    replacements.id_jogo = id_jogo;
  }
  if (periodo?.desde) {
    condicoes.push('p.jogada_em >= :desde');
    replacements.desde = periodo.desde;
  }
  if (periodo?.ateExclusivo) {
    condicoes.push('p.jogada_em < :ateExclusivo');
    replacements.ateExclusivo = periodo.ateExclusivo;
  }

  const linhas = await sequelize.query(
    `
    WITH totais AS (
      SELECT pr.id_jogador,
             COUNT(*)::int AS partidas,
             COUNT(*) FILTER (WHERE pr.vencedor)::int AS vitorias
        FROM partida_resultado pr
        JOIN partida p ON p.id = pr.id_partida
       WHERE ${condicoes.join(' AND ')}
       GROUP BY pr.id_jogador
    )
    SELECT RANK() OVER (ORDER BY t.vitorias DESC, t.vitorias::numeric / t.partidas DESC)::int AS posicao,
           j.id AS id_jogador, j.nome, j.ativo, t.vitorias, t.partidas
      FROM totais t
      JOIN jogador j ON j.id = t.id_jogador
     ORDER BY posicao, t.partidas DESC, j.nome ASC, j.id ASC
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  return linhas.map((l) => ({
    ...l,
    percentual_vitorias: Math.round((l.vitorias / l.partidas) * 1000) / 10,
  }));
};

module.exports = { obterRankingGeral };
