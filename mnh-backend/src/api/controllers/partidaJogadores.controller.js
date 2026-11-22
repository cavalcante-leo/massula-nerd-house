const partidaJogadoresService = require('../services/partidaJogadores.service');
const jogadorService = require('../services/jogador.service');
const partidaService = require('../services/partidas.service');
const jogadorNivelService = require('../services/jogadorNivel.service');
const jogoService = require('../services/jogo.service');
const { responderErro } = require('../../helpers/erros');

const validarEstatisticas = (configCampos, estatisticas) => {
  if (estatisticas === undefined || estatisticas === null) return null;
  if (typeof estatisticas !== 'object' || Array.isArray(estatisticas)) {
    return 'estatisticas deve ser um objeto.';
  }
  for (const campo of configCampos) {
    const valor = estatisticas[campo.nome];
    if (valor === undefined || valor === null) continue;
    if (campo.tipo === 'numero' && typeof valor !== 'number') {
      return `O campo "${campo.nome}" deve ser numérico.`;
    }
    if (campo.tipo === 'booleano' && typeof valor !== 'boolean') {
      return `O campo "${campo.nome}" deve ser booleano (true/false).`;
    }
    if (campo.tipo === 'texto' && typeof valor !== 'string') {
      return `O campo "${campo.nome}" deve ser texto.`;
    }
  }
  return null;
};

exports.adicionarJogadorNaPartida = async (req, res) => {
  try {
    const { id_partida, id_jogador } = req.params;
    const { posicao_final } = req.body;

    if (posicao_final !== undefined && posicao_final !== null) {
      if (!Number.isInteger(Number(posicao_final)) || Number(posicao_final) < 1) {
        return res.status(400).json({ erro: 'posicao_final deve ser inteiro >= 1.' });
      }
    }

    const partida = await partidaService.encontrarPartida(id_partida);
    if (!partida) return res.status(404).json({ erro: 'Partida não encontrada.' });

    const jogador = await jogadorService.encontrarJogador(id_jogador);
    if (!jogador) return res.status(404).json({ erro: 'Jogador não encontrado.' });

    const nivelRegistro = await jogadorNivelService.encontrarNivel(id_jogador, partida.id_jogo);
    if (!nivelRegistro) {
      return res.status(400).json({
        erro: `Jogador ${id_jogador} não possui nível cadastrado para o jogo ${partida.id_jogo}. Cadastre o nível em PUT /api/jogador-nivel/jogador/${id_jogador}/jogo/${partida.id_jogo} antes de adicioná-lo à partida.`,
      });
    }

    const participante = await partidaJogadoresService.adicionarParticipante(
      id_partida,
      id_jogador,
      { posicao_final },
    );
    return res.status(201).json(participante);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Jogador já registrado nessa partida.' });
    }
    return responderErro(res, err, 'Erro ao adicionar jogador à partida.');
  }
};

exports.listarParticipantes = async (req, res) => {
  try {
    const { id_partida } = req.params;
    const participantes = await partidaJogadoresService.listarParticipantesDaPartida(id_partida);
    return res.json(participantes);
  } catch (err) {
    return responderErro(res, err, 'Erro ao listar participantes.');
  }
};

exports.atualizarParticipante = async (req, res) => {
  try {
    const { id_partida, id_jogador } = req.params;
    const dados = req.body;

    if (dados.posicao_final !== undefined && dados.posicao_final !== null) {
      if (!Number.isInteger(Number(dados.posicao_final)) || Number(dados.posicao_final) < 1) {
        return res.status(400).json({ erro: 'posicao_final deve ser inteiro >= 1.' });
      }
    }
    if (dados.vencedor !== undefined && typeof dados.vencedor !== 'boolean') {
      return res.status(400).json({ erro: 'vencedor deve ser true ou false.' });
    }

    if (dados.estatisticas !== undefined) {
      const partida = await partidaService.encontrarPartida(id_partida);
      if (!partida) return res.status(404).json({ erro: 'Partida não encontrada.' });
      const jogo = await jogoService.encontrarJogo(partida.id_jogo);
      const erro = validarEstatisticas(jogo ? jogo.config_campos || [] : [], dados.estatisticas);
      if (erro) return res.status(400).json({ erro });
    }

    const participante = await partidaJogadoresService.atualizarParticipante(id_partida, id_jogador, dados);
    return res.json({ sucesso: true, participante });
  } catch (err) {
    return responderErro(res, err, 'Erro ao atualizar participante.');
  }
};

exports.removerParticipante = async (req, res) => {
  try {
    const { id_partida, id_jogador } = req.params;
    await partidaJogadoresService.removerParticipante(id_partida, id_jogador);
    return res.json({ sucesso: true });
  } catch (err) {
    return responderErro(res, err, 'Erro ao remover participante.');
  }
};
