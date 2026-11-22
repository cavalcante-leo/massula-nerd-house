const partidasService = require('../services/partidas.service');
const jogoService = require('../services/jogo.service');
const { validarInstante, intervaloDoPeriodo } = require('../../helpers/data.helpers');

const ERRO_JOGADA_EM = 'Campo jogada_em deve ser data e hora ISO 8601 com fuso (ex.: 2026-11-22T23:00:00.000Z ou 2026-11-22T20:00:00-03:00).';

exports.criarPartida = async (req, res) => {
  try {
    const { id_jogo, nivel, jogada_em } = req.body;
    const criado_por = req.usuario.id;

    if (!id_jogo || !nivel || !jogada_em) {
      return res.status(400).json({ erro: 'Campos obrigatórios: id_jogo, nivel, jogada_em.' });
    }

    const jogo = await jogoService.encontrarJogo(id_jogo);
    if (!jogo) {
      return res.status(404).json({ erro: `Jogo com id ${id_jogo} não encontrado.` });
    }

    const dataJogada = validarInstante(jogada_em);
    if (!dataJogada) {
      return res.status(400).json({ erro: ERRO_JOGADA_EM });
    }

    const partida = await partidasService.criarPartida({ id_jogo, nivel, jogada_em: dataJogada, criado_por });
    return res.status(201).json(partida);
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ erro: 'Violação de chave estrangeira. Verifique se id_jogo existe.' });
    }
    return res.status(500).json({ erro: 'Erro ao criar partida.', codigo: err.message });
  }
};

exports.listarPartidas = async (req, res) => {
  try {
    const filtros = req.query;
    // Dias (dd/mm/aaaa ou AAAA-MM-DD) no fuso do clube; o dia final entra inteiro.
    const periodo = intervaloDoPeriodo(filtros.jogada_em_inicio, filtros.jogada_em_fim);
    if (!periodo) {
      return res.status(400).json({ erro: 'jogada_em_inicio/jogada_em_fim inválidos. Use dd/mm/aaaa, AAAA-MM-DD ou ISO 8601 com fuso.' });
    }
    const partidas = await partidasService.listarPartidas(filtros, periodo);
    return res.json(partidas);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
};

exports.obterPartida = async (req, res) => {
  try {
    const { id } = req.params;
    const partida = await partidasService.encontrarPartida(id);
    if (!partida) return res.status(404).json({ erro: 'Partida não encontrada' });
    return res.json(partida);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
};

exports.atualizarPartida = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = { ...req.body };
    const atualizado_por = req.usuario.id;
    if (dados.jogada_em !== undefined) {
      dados.jogada_em = validarInstante(dados.jogada_em);
      if (!dados.jogada_em) return res.status(400).json({ erro: ERRO_JOGADA_EM });
    }
    const partida = await partidasService.atualizarPartida(id, dados, atualizado_por);
    return res.json({ sucesso: true, partida });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
};

exports.deletarPartida = async (req, res) => {
  try {
    const { id } = req.params;
    await partidasService.removerPartida(id);
    return res.json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
};

exports.rankingPartida = async (req, res) => {
  try {
    const { id } = req.params;
    const ranking = await partidasService.obterRankingPartida(id);
    return res.json(ranking);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
};