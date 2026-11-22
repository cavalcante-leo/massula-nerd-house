// Ids de rota devem ser inteiros positivos que caibam em INTEGER do Postgres.
// Sem isso, `/jogador/listar/abc` chega ao banco e vira 500 (erro de sintaxe do tipo).
const PARAMS_ID = ['id', 'id_jogador', 'id_jogo', 'id_partida'];
const INT_MAX = 2147483647;

const ehIdValido = (valor) => typeof valor === 'string'
  && /^[1-9]\d{0,9}$/.test(valor)
  && Number(valor) <= INT_MAX;

// Registra a validação em todos os parâmetros de id do router (400 se inválido).
const validarIdsDaRota = (router) => {
  for (const nome of PARAMS_ID) {
    router.param(nome, (req, res, next, valor) => {
      if (!ehIdValido(valor)) {
        return res.status(400).json({ erro: `Parâmetro ${nome} inválido: use um inteiro positivo.` });
      }
      return next();
    });
  }
};

module.exports = { validarIdsDaRota, ehIdValido };
