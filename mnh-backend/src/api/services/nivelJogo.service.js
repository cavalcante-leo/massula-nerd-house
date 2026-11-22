const { Op } = require('sequelize');
const { NivelJogo, Jogo, JogadorNivelJogo, Jogador } = require('../models');

const encontrarNivel = async (id) => {
  return await NivelJogo.findByPk(id, {
    include: [{ model: Jogo, as: 'jogo', attributes: ['id', 'nome'] }],
  });
};

const encontrarNiveisPorJogo = async (id_jogo, filtros = {}) => {
  const where = { id_jogo };
  if (filtros.ativo === true || filtros.ativo === false) where.ativo = filtros.ativo;

  return await NivelJogo.findAll({
    where,
    include: [
      { model: Jogo, as: 'jogo', attributes: ['id', 'nome'] },
      {
        model: JogadorNivelJogo,
        as: 'jogadoresNivel',
        include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome'] }],
      },
    ],
    order: [['nivel', 'ASC']],
  });
};

const encontrarPorJogoENivel = async (id_jogo, nivel, ignorarId = null) => {
  const where = { id_jogo, nivel };
  if (ignorarId) where.id = { [Op.ne]: ignorarId };
  return await NivelJogo.findOne({ where });
};

const criarNivel = async ({ id_jogo, nivel, modelo, criado_por }) => {
  return await NivelJogo.create({ id_jogo, nivel, modelo, ativo: true, criado_por });
};

const atualizarNivel = async (id, dados, atualizado_por) => {
  const nivel = await NivelJogo.findByPk(id);
  if (!nivel) return null;

  const { nivel: valorNivel, modelo, ativo } = dados;
  if (valorNivel !== undefined) nivel.nivel = valorNivel;
  if (modelo !== undefined) nivel.modelo = modelo;
  if (ativo !== undefined) nivel.ativo = ativo;
  nivel.atualizado_por = atualizado_por;
  await nivel.save();
  return nivel;
};

const contarJogadoresVinculados = async (id_nivel_jogo) => {
  return await JogadorNivelJogo.count({ where: { id_nivel_jogo } });
};

module.exports = {
  encontrarNivel,
  encontrarNiveisPorJogo,
  encontrarPorJogoENivel,
  criarNivel,
  atualizarNivel,
  contarJogadoresVinculados,
};
