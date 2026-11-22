const presencasService = require('../services/presenca.service');
const dataHelpers = require('../../helpers/data.helpers');
const jogadorService = require('../services/jogador.service');
const { responderErro } = require('../../helpers/erros');

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
    const { inicio, fim } = req.query;
    // Aceita dd/mm/aaaa ou AAAA-MM-DD (o <input type="date"> do frontend).
    const dataInicio = inicio ? dataHelpers.paraDataBanco(inicio) : null;
    const dataFim = fim ? dataHelpers.paraDataBanco(fim) : null;
    if ((inicio && !dataInicio) || (fim && !dataFim)) {
      return res.status(400).json({ erro: 'Datas de início ou fim inválidas. Use dd/mm/aaaa ou AAAA-MM-DD.' });
    }
    const presencas = await presencasService.listarPresencasPorPeriodo(dataInicio, dataFim);
    return res.json(presencas);
  } catch (err) {
    return responderErro(res, err, 'Erro ao listar presenças.');
  }
};
