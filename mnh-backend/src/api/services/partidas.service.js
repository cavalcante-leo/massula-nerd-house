const {
  Partida, Jogo, NivelJogo, PartidaResultado, Jogador, sequelize,
} = require('../models');
const { Op } = require('sequelize');
const { ErroDominio } = require('../../helpers/erros');

const encontrarPartida = async (id) => {
  return await Partida.findByPk(id, {
    include: [
      { model: Jogo, as: 'jogo', attributes: ['id', 'nome'] },
      { model: NivelJogo, as: 'nivelJogo', attributes: ['id', 'nivel', 'modelo'] },
    ],
  });
};

// `periodo`: `{ desde, ateExclusivo }` de `intervaloDoPeriodo` (data.helpers), ou null.
const listarPartidas = async (filtros = {}, periodo = null) => {
  const where = {};
  if (filtros.id_jogo) where.id_jogo = filtros.id_jogo;
  if (filtros.id_nivel_jogo) where.id_nivel_jogo = filtros.id_nivel_jogo;
  if (periodo?.desde || periodo?.ateExclusivo) {
    where.jogada_em = {};
    if (periodo.desde) where.jogada_em[Op.gte] = periodo.desde;
    if (periodo.ateExclusivo) where.jogada_em[Op.lt] = periodo.ateExclusivo;
  }
  const partidas = await Partida.findAll({
    where,
    include: [
      { model: Jogo, as: 'jogo' },
      { model: NivelJogo, as: 'nivelJogo' },
      {
        model: PartidaResultado,
        as: 'resultados',
        include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome'] }],
      },
    ],
    order: [['jogada_em', 'DESC']],
  });

  return partidas.map((p) => {
    const json = p.toJSON();
    const resultados = json.resultados || [];
    const vencedor =
      resultados.find((r) => r.vencedor) || resultados.find((r) => r.posicao_final === 1);
    json.vencedor = vencedor ? vencedor.jogador?.nome ?? null : null;
    json.total_jogadores = resultados.length;
    delete json.resultados;
    return json;
  });
};

const criarPartida = async (dados) => {
  const { id_jogo, nivel, jogada_em, criado_por } = dados;

  const [nivelJogo] = await NivelJogo.findOrCreate({
    where: { id_jogo, nivel },
    defaults: { id_jogo, nivel, criado_por },
  });

  if (!nivelJogo.ativo) {
    nivelJogo.ativo = true;
    await nivelJogo.save();
  }

  return await Partida.create({
    id_jogo,
    id_nivel_jogo: nivelJogo.id,
    jogada_em,
    criado_por
  });
};

const atualizarPartida = async (id, dados, atualizado_por) => {
  const partida = await encontrarPartida(id);
  if (!partida) throw new Error('Partida não encontrada');

  // Lista branca: só estes campos vêm do cliente. criado_por, ativo, criado_em etc. nunca.
  const update = { atualizado_por };
  if (dados.jogada_em !== undefined) update.jogada_em = dados.jogada_em;
  if (dados.id_jogo !== undefined) update.id_jogo = dados.id_jogo;

  const idJogo = update.id_jogo ?? partida.id_jogo;
  const trocouJogo = Number(idJogo) !== partida.id_jogo;
  if (trocouJogo) {
    // Os participantes têm nível e estatísticas do jogo atual; trocar o jogo os deixaria
    // inconsistentes. Para corrigir o cadastro, remova os participantes antes.
    const participantes = await PartidaResultado.count({ where: { id_partida: partida.id } });
    if (participantes > 0) {
      throw new ErroDominio(409, 'Não é possível trocar o jogo de uma partida que já tem participantes. Remova os participantes antes.');
    }
  }
  // Trocar de jogo sem informar o nível mantém o número do nível, mas no catálogo do novo
  // jogo: id_nivel_jogo nunca pode apontar para um nível de outro jogo.
  const nivel = dados.nivel ?? (trocouJogo ? partida.nivelJogo?.nivel : undefined);
  if (nivel !== undefined) {
    const [nivelJogo] = await NivelJogo.findOrCreate({
      where: { id_jogo: idJogo, nivel },
      defaults: { id_jogo: idJogo, nivel, criado_por: atualizado_por },
    });
    update.id_nivel_jogo = nivelJogo.id;
  }

  await partida.update(update);
  return partida;
};

// Hard delete (README): apaga os resultados e a partida juntos; sem isso, a FK
// partida_resultado → partida barra o DELETE de qualquer partida com participantes.
const removerPartida = async (id) => {
  await sequelize.transaction(async (transaction) => {
    const partida = await Partida.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!partida) throw new Error('Partida não encontrada');
    await PartidaResultado.destroy({ where: { id_partida: partida.id }, transaction });
    await partida.destroy({ transaction });
  });
};

const obterRankingPartida = async (id_partida) => {
  return await PartidaResultado.findAll({
    where: { id_partida },
    include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome'] }],
    order: [['posicao_final', 'ASC']],
  });
};

module.exports = {
  encontrarPartida,
  listarPartidas,
  criarPartida,
  atualizarPartida,
  removerPartida,
  obterRankingPartida,
};
