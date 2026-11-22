const { PartidaResultado, Jogador } = require('../models');

const encontrarParticipante = async (id_partida, id_jogador) => {
  return await PartidaResultado.findOne({ where: { id_partida, id_jogador } });
};

const listarParticipantesDaPartida = async (id_partida) => {
  return await PartidaResultado.findAll({
    where: { id_partida },
    include: [{ model: Jogador, as: 'jogador', attributes: ['id', 'nome'] }],
    order: [['posicao_final', 'ASC']],
  });
};

const adicionarParticipante = async (id_partida, id_jogador, dados = {}) => {
  const existe = await encontrarParticipante(id_partida, id_jogador);
  if (existe) throw new Error('Jogador já está na partida');
  return await PartidaResultado.create({
    id_partida,
    id_jogador,
    posicao_final: dados.posicao_final ?? null,
    estatisticas: dados.estatisticas ?? {},
    vencedor: dados.vencedor ?? (dados.posicao_final === 1),
  });
};

// Lista branca: só o resultado do jogador é editável. id_partida/id_jogador vêm da URL e
// não mudam (trocar o jogador = remover e adicionar).
const CAMPOS_EDITAVEIS_PARTICIPANTE = ['posicao_final', 'estatisticas', 'vencedor'];

const atualizarParticipante = async (id_partida, id_jogador, dados) => {
  const participante = await encontrarParticipante(id_partida, id_jogador);
  if (!participante) throw new Error('Participante não encontrado');
  const update = {};
  for (const campo of CAMPOS_EDITAVEIS_PARTICIPANTE) {
    if (dados[campo] !== undefined) update[campo] = dados[campo];
  }
  await participante.update(update);
  return participante;
};

const removerParticipante = async (id_partida, id_jogador) => {
  const participante = await encontrarParticipante(id_partida, id_jogador);
  if (!participante) throw new Error('Participante não encontrado');
  await participante.destroy();
};

module.exports = {
  encontrarParticipante,
  listarParticipantesDaPartida,
  adicionarParticipante,
  atualizarParticipante,
  removerParticipante,
};
