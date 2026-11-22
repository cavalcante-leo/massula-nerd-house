const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRES_IN = '8h';

const gerarAccessToken = (usuarioId, usuarioTipo) => jwt.sign(
  { id: usuarioId, tipo: usuarioTipo },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN },
);

const validarAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const SEGREDO_MIN = 32;
const PLACEHOLDER_ENV_EXAMPLE = 'troque-por-um-segredo-longo-e-aleatorio';

// Ambientes em que um segredo fraco é tolerado. Fail-safe: se o NODE_ENV não for definido
// (ex.: esqueceram de configurar no Render), a regra forte vale.
const AMBIENTES_LOCAIS = ['development', 'test'];

// Fora de dev/test, um segredo curto ou o placeholder do .env.example permitiria forjar
// tokens de superadmin. Retorna a mensagem de erro, ou null se estiver ok.
const problemaNoSegredoJwt = (segredo, nodeEnv) => {
  if (!segredo) return 'JWT_SECRET não definido.';
  if (AMBIENTES_LOCAIS.includes(nodeEnv)) return null;
  if (segredo === PLACEHOLDER_ENV_EXAMPLE) return 'JWT_SECRET ainda é o placeholder do .env.example.';
  if (segredo.length < SEGREDO_MIN) return `JWT_SECRET precisa ter pelo menos ${SEGREDO_MIN} caracteres fora de development/test.`;
  return null;
};

module.exports = {
  gerarAccessToken,
  validarAccessToken,
  problemaNoSegredoJwt,
};
