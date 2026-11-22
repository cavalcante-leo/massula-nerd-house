const { Op } = require('sequelize');
const {
  JogadorNivelJogo, NivelJogo, Jogo, Jogador, sequelize,
} = require('../models');
const nivelJogoService = require('./nivelJogo.service');

// Com o nível único por jogo garantido em criarOuAtualizarNivel, há no máximo um vínculo;
// a ordenação só torna determinístico o caso de dados antigos duplicados (fica o mais recente).
const encontrarNivel = async (id_jogador, id_jogo) => {
  return await JogadorNivelJogo.findOne({
    where: { id_jogador },
    include: [{
      model: NivelJogo,
      as: 'nivelJogo',
      where: { id_jogo },
    }],
    order: [['id', 'DESC']],
  });
};

const encontrarNiveisPorJogador = async (id_jogador) => {
  return await JogadorNivelJogo.findAll({
    where: { id_jogador },
    include: [{
      model: NivelJogo,
      as: 'nivelJogo',
      include: [{ model: Jogo, as: 'jogo', attributes: ['id', 'nome'] }],
    }],
  });
};

const encontrarNiveisPorJogo = async (id_jogo) => {
  return await NivelJogo.findAll({
    where: { id_jogo },
    include: [{
      model: JogadorNivelJogo,
      as: 'jogadoresNivel',
      include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome'] }],
    }],
    order: [['nivel', 'DESC']],
  });
};

/**
 * Define o nível do jogador num jogo: o jogador tem **um** nível por jogo, então o vínculo
 * anterior (com outro nível do mesmo jogo) é substituído, não acumulado.
 * Tudo numa transação, com lock na linha do jogador para serializar definições simultâneas.
 */
const criarOuAtualizarNivel = async (id_jogador, id_jogo, nivel) => {
  return await sequelize.transaction(async (transaction) => {
    await Jogador.findByPk(id_jogador, { transaction, lock: transaction.LOCK.UPDATE });

    const nivelJogo = await nivelJogoService.exigirNivelAtivo(id_jogo, nivel, transaction);

    const vinculosNoJogo = await JogadorNivelJogo.findAll({
      where: { id_jogador },
      include: [{ model: NivelJogo, as: 'nivelJogo', attributes: [], where: { id_jogo } }],
      transaction,
    });

    const atual = vinculosNoJogo.find((v) => v.id_nivel_jogo === nivelJogo.id);
    const anteriores = vinculosNoJogo.filter((v) => v !== atual).map((v) => v.id);
    if (anteriores.length) {
      await JogadorNivelJogo.destroy({ where: { id: { [Op.in]: anteriores } }, transaction });
    }

    return atual || await JogadorNivelJogo.create(
      { id_jogador, id_nivel_jogo: nivelJogo.id },
      { transaction },
    );
  });
};

module.exports = {
  encontrarNivel,
  encontrarNiveisPorJogador,
  encontrarNiveisPorJogo,
  criarOuAtualizarNivel,
};
