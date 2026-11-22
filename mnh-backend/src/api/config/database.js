const { Sequelize } = require('sequelize');
const { montarDialectOptions, montarPool } = require('./dbOptions');

const isDev = process.env.NODE_ENV !== 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: isDev ? console.log : false,
  dialectOptions: montarDialectOptions(),
  pool: montarPool(),
});

module.exports = sequelize;
