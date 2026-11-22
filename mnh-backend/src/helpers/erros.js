// Erro de regra de negócio com status HTTP e mensagem segura para o cliente.
// Services lançam; controllers traduzem com `responderErroDominio`.
class ErroDominio extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'ErroDominio';
    this.status = status;
  }
}

// Responde e retorna true se `err` for ErroDominio; senão retorna false.
const responderErroDominio = (res, err) => {
  if (!(err instanceof ErroDominio)) return false;
  res.status(err.status).json({ erro: err.message });
  return true;
};

/**
 * Catch padrão dos controllers: ErroDominio vira o status e a mensagem dele; qualquer
 * outro erro é logado no servidor e o cliente recebe só `mensagem500` (nunca err.message,
 * que pode expor SQL, constraints e detalhes do Postgres).
 */
const responderErro = (res, err, mensagem500) => {
  if (responderErroDominio(res, err)) return undefined;
  console.error(`${mensagem500}`, err);
  return res.status(500).json({ erro: mensagem500 });
};

module.exports = { ErroDominio, responderErroDominio, responderErro };
