const rankingService = require('../services/ranking.service');
const { ehIdValido } = require('../middlewares/validarIds');
const { intervaloDoPeriodo } = require('../../helpers/data.helpers');
const { responderErro } = require('../../helpers/erros');

exports.rankingGeral = async (req, res) => {
  try {
    const { id_jogo, inicio, fim } = req.query;
    if (id_jogo !== undefined && !ehIdValido(id_jogo)) {
      return res.status(400).json({ erro: 'id_jogo deve ser um inteiro positivo.' });
    }
    // Mesmo formato de período de /partida/listar: dias no fuso do clube, fim inclusivo.
    const periodo = intervaloDoPeriodo(inicio, fim);
    if (!periodo) {
      return res.status(400).json({ erro: 'inicio/fim inválidos. Use dd/mm/aaaa, AAAA-MM-DD ou ISO 8601 com fuso.' });
    }
    const ranking = await rankingService.obterRankingGeral({ id_jogo }, periodo);
    return res.json(ranking);
  } catch (err) {
    return responderErro(res, err, 'Erro ao obter ranking.');
  }
};
