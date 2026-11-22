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

module.exports = { ErroDominio, responderErroDominio };
