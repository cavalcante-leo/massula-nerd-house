const esperar = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Tenta `sequelize.authenticate()` até `tentativas` vezes, com espera exponencial
 * (esperaInicialMs, 2x, 4x...). A primeira conexão ao Supabase às vezes estoura o timeout
 * e funciona logo depois; sem isso, o boot sairia e o Render faria um restart com cold start.
 * Lança o último erro se todas falharem.
 */
const conectarComRetentativas = async (sequelize, {
  tentativas = 3,
  esperaInicialMs = 2000,
  aoFalhar = () => {},
  dormir = esperar,
} = {}) => {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      await sequelize.authenticate();
      return tentativa;
    } catch (err) {
      ultimoErro = err;
      if (tentativa < tentativas) {
        const espera = esperaInicialMs * (2 ** (tentativa - 1));
        aoFalhar(err, tentativa, espera);
        await dormir(espera);
      }
    }
  }
  throw ultimoErro;
};

module.exports = { conectarComRetentativas };
