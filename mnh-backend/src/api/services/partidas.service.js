const { Partida, Jogo, NivelJogo, PartidaResultado, Jogador } = require('../models');
const { Op } = require('sequelize');

const encontrarPartida = async (id) => {
  return await Partida.findByPk(id, {
    include: [
      { model: Jogo, as: 'jogo', attributes: ['id', 'nome'] },
      { model: NivelJogo, as: 'nivelJogo', attributes: ['id', 'nivel', 'modelo'] },
    ],
  });
};

const listarPartidas = async (filtros = {}) => {
  const where = {};
  if (filtros.id_jogo) where.id_jogo = filtros.id_jogo;
  if (filtros.id_nivel_jogo) where.id_nivel_jogo = filtros.id_nivel_jogo;
  if (filtros.jogada_em_inicio && filtros.jogada_em_fim) {
    where.jogada_em = { [Op.between]: [filtros.jogada_em_inicio, filtros.jogada_em_fim] };
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

  const update = { ...dados, atualizado_por };
  delete update.nivel;
  delete update.id_nivel_jogo;

  const idJogo = dados.id_jogo ?? partida.id_jogo;
  if (dados.nivel !== undefined) {
    const [nivelJogo] = await NivelJogo.findOrCreate({
      where: { id_jogo: idJogo, nivel: dados.nivel },
      defaults: { id_jogo: idJogo, nivel: dados.nivel, criado_por: atualizado_por },
    });
    update.id_nivel_jogo = nivelJogo.id;
  }

  await partida.update(update);
  return partida;
};

const removerPartida = async (id) => {
  const partida = await encontrarPartida(id);
  if (!partida) throw new Error('Partida não encontrada');
  await partida.destroy();
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
