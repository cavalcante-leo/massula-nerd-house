const { JogadorPresenca, Jogador, sequelize } = require('../models');
const { Op, UniqueConstraintError } = require('sequelize');
const dataHelpers = require('../../helpers/data.helpers');
const jogadorService = require('./jogador.service');

// Presença removida fica com ativo = false (soft delete) e não conta para total nem patente.
const contarPresencasPorJogador = async (id_jogador, transaction = null) => {
  return await JogadorPresenca.count({ where: { id_jogador, ativo: true }, transaction });
};

const verificarPresencaNaData = async (id_jogador, data_presenca, transaction = null) => {
  const presenca = await JogadorPresenca.findOne({
    where: { id_jogador, data_presenca, ativo: true },
    transaction,
  });
  return !!presenca;
};

const registrarNovaPresenca = async (id_jogador, data_presenca, criado_por, transaction = null) => {
  return await JogadorPresenca.create({ id_jogador, data_presenca, criado_por }, { transaction });
};

const ERRO_PRESENCA_DUPLICADA = { status: 409, mensagem: 'Presença já registrada para essa data.' };

/**
 * Fluxo completo de registro de presença, usado pelas duas rotas que registram presença.
 * Validações sem banco acontecem antes de abrir a transação; a transação é gerenciada
 * (commit/rollback automáticos), então nenhum retorno antecipado deixa conexão presa no pool.
 *
 * Retorna `{ erro: { status, mensagem } }` ou `{ jogador, presenca, totalPresencas }`.
 */
const registrarPresencaDoJogador = async ({ id_jogador, data, criado_por }) => {
  if (!dataHelpers.validarData(data)) {
    return { erro: { status: 400, mensagem: 'Data inválida. Use o formato dd/mm/aaaa.' } };
  }
  if (dataHelpers.dataEhFutura(data)) {
    return { erro: { status: 400, mensagem: 'Não é possível registrar presença em data futura.' } };
  }
  const dataPresenca = dataHelpers.formatarParaBanco(data);

  try {
    return await sequelize.transaction(async (transaction) => {
      const jogador = await jogadorService.encontrarJogador(id_jogador, transaction);
      if (!jogador) {
        return { erro: { status: 404, mensagem: 'Jogador não encontrado.' } };
      }
      // O índice único (jogador, data) inclui as presenças removidas: registrar de novo
      // num dia removido reativa a linha em vez de inserir. O lock serializa registros
      // simultâneos do mesmo dia (o segundo vê a linha já ativa e recebe 409).
      const existente = await JogadorPresenca.findOne({
        where: { id_jogador, data_presenca: dataPresenca },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (existente?.ativo) {
        return { erro: ERRO_PRESENCA_DUPLICADA };
      }
      const presenca = existente
        ? await existente.update({ ativo: true, atualizado_por: criado_por }, { transaction })
        : await registrarNovaPresenca(id_jogador, dataPresenca, criado_por, transaction);
      const totalPresencas = await contarPresencasPorJogador(id_jogador, transaction);
      return { jogador, presenca, totalPresencas };
    });
  } catch (err) {
    // Duas requisições simultâneas para o mesmo dia: a segunda bate no índice único.
    if (err instanceof UniqueConstraintError) return { erro: ERRO_PRESENCA_DUPLICADA };
    throw err;
  }
};

// `inicio`/`fim`: strings AAAA-MM-DD (inclusivas) ou null para não limitar.
const listarPresencasPorPeriodo = async (inicio, fim) => {
  const periodo = {};
  if (inicio) periodo[Op.gte] = inicio;
  if (fim) periodo[Op.lte] = fim;
  return await JogadorPresenca.findAll({
    where: {
      ativo: true,
      ...(Object.getOwnPropertySymbols(periodo).length ? { data_presenca: periodo } : {}),
    },
    include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome'] }],
    order: [['data_presenca', 'ASC']],
  });
};

module.exports = {
  contarPresencasPorJogador,
  verificarPresencaNaData,
  registrarNovaPresenca,
  registrarPresencaDoJogador,
  listarPresencasPorPeriodo,
};
