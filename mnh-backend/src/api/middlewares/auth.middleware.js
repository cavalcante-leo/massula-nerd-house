const { validarAccessToken } = require('../config/jwt');
const { Usuario } = require('../models');

// Além de validar o JWT, confere o usuário no banco a cada requisição: um usuário
// desativado (ou rebaixado de superadmin) perde o acesso na hora, sem esperar o token expirar.
// O papel usado nas autorizações é o do banco, não o gravado no token.
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ erro: 'Token malformado.' });
  }

  let decoded;
  try {
    decoded = validarAccessToken(parts[1]);
  } catch (err) {
    const expirado = err && err.name === 'TokenExpiredError';
    return res.status(401).json({
      erro: expirado ? 'Token expirado.' : 'Token inválido.',
    });
  }

  if (!Number.isInteger(decoded?.id)) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }

  let usuario;
  try {
    usuario = await Usuario.findByPk(decoded.id, { attributes: ['id', 'tipo', 'ativo'] });
  } catch (err) {
    console.error('Erro ao validar usuário do token:', err);
    return res.status(500).json({ erro: 'Erro ao validar autenticação.' });
  }

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'Usuário inexistente ou desativado.' });
  }

  req.usuario = { id: usuario.id, tipo: usuario.tipo };
  return next();
};
