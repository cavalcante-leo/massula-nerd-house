const presencasService = require('../services/presenca.service');
const dataHelpers = require('../../helpers/data.helpers');
const jogadorService = require('../services/jogador.service');
const { responderErro } = require('../../helpers/erros');
const { ehIdValido } = require('../middlewares/validarIds');

exports.registrarPresenca = async (req, res) => {
  try {
    const { id_jogador } = req.params;
    const criado_por = req.usuario.id;

    const resultado = await presencasService.registrarPresencaDoJogador({
      id_jogador,
      data: req.body.data,
      criado_por,
    });
    if (resultado.erro) {
      return res.status(resultado.erro.status).json({ erro: resultado.erro.mensagem });
    }
    const { jogador, presenca, totalPresencas } = resultado;

    return res.status(201).json({
      sucesso: true,
      presenca,
      jogador: {
        id: jogador.id,
        nome: jogador.nome,
        patente: jogadorService.calcularPatente(totalPresencas),
        criado_por: criado_por
      },
    });
  } catch (err) {
    return responderErro(res, err, 'Erro ao registrar presença.');
  }
};

exports.listarPresencas = async (req, res) => {
  try {
    const { inicio, fim, id_jogador } = req.query;
    if (id_jogador !== undefined && !ehIdValido(id_jogador)) {
      return res.status(400).json({ erro: 'id_jogador deve ser um inteiro positivo.' });
    }
    // Aceita dd/mm/aaaa ou AAAA-MM-DD (o <input type="date"> do frontend).
    const dataInicio = inicio ? dataHelpers.paraDataBanco(inicio) : null;
    const dataFim = fim ? dataHelpers.paraDataBanco(fim) : null;
    if ((inicio && !dataInicio) || (fim && !dataFim)) {
      return res.status(400).json({ erro: 'Datas de início ou fim inválidas. Use dd/mm/aaaa ou AAAA-MM-DD.' });
    }
    const presencas = await presencasService.listarPresencasPorPeriodo(dataInicio, dataFim, id_jogador);
    return res.json(presencas);
  } catch (err) {
    return responderErro(res, err, 'Erro ao listar presenças.');
  }
};

exports.removerPresenca = async (req, res) => {
  try {
    const { presenca, totalPresencas } = await presencasService.removerPresenca(req.params.id, req.usuario.id);
    return res.status(200).json({
      sucesso: 'Presença removida com sucesso.',
      id: presenca.id,
      id_jogador: presenca.id_jogador,
      data_presenca: presenca.data_presenca,
      presencas_total: totalPresencas,
      patente: jogadorService.calcularPatente(totalPresencas),
    });
  } catch (err) {
    return responderErro(res, err, 'Erro ao remover presença.');
  }
};
