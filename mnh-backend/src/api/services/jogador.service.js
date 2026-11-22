const { Jogador } = require('../models');

const encontrarJogador = async (id, transaction = null) => {
    return await Jogador.findByPk(id, { transaction });
}

const calcularPatente = (totalPresencas) => {
  if (totalPresencas >= 300) return 6;
  if (totalPresencas >= 200) return 5;
  if (totalPresencas >= 100) return 4;
  if (totalPresencas >= 50) return 3;
  if (totalPresencas >= 10) return 2;
  return 1;
};

module.exports = {
    encontrarJogador,
    calcularPatente,
}