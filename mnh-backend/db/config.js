// Configuração do sequelize-cli (migrations e seeders).
// URL: DIRECT_URL, ou DATABASE_URL como fallback — desde que não seja o transaction pooler.
require('dotenv').config();
const { montarDialectOptions } = require('../src/api/config/dbOptions');

const PORTA_TRANSACTION_POOLER = '6543';

const resolverUrl = () => {
  const nomeVariavel = process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL';
  const url = process.env[nomeVariavel];
  if (!url) {
    throw new Error('Defina DIRECT_URL (ou DATABASE_URL) para rodar migrations e seeders.');
  }

  let porta;
  try {
    porta = new URL(url).port;
  } catch {
    throw new Error(`${nomeVariavel} inválida.`);
  }
  if (porta === PORTA_TRANSACTION_POOLER) {
    throw new Error(
      `${nomeVariavel} aponta para o transaction pooler (porta 6543), que não preserva estado de sessão. `
      + 'Use o session pooler (porta 5432) em DIRECT_URL para rodar migrations e seeders.',
    );
  }
  return url;
};

const config = {
  url: resolverUrl(),
  dialect: 'postgres',
  dialectOptions: montarDialectOptions(),
  seederStorage: 'sequelize',
  logging: false,
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
