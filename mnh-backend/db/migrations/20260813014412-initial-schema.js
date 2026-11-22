'use strict';

const fs = require('fs');
const path = require('path');

const SQL_PATH = path.join(__dirname, '..', 'sql', '0001_initial_schema.sql');

// Ordem inversa de dependência (filhas antes das mães).
const TABELAS = [
  'partida_resultado',
  'jogador_nivel_jogo',
  'jogador_presenca',
  'partida',
  'nivel_jogo',
  'jogador',
  'jogo',
  'usuario',
];

module.exports = {
  async up(queryInterface) {
    const sql = fs.readFileSync(SQL_PATH, 'utf8');
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(sql, { transaction });
    });
  },

  // Destrutivo: apaga todas as tabelas e dados. Só roda com opt-in explícito,
  // para que um `db:migrate:undo` acidental em produção não zere o banco.
  async down(queryInterface) {
    if (process.env.PERMITIR_DOWN_DESTRUTIVO !== 'true') {
      throw new Error(
        'Reverter o schema inicial apaga TODAS as tabelas e dados. '
        + 'Para confirmar, rode com PERMITIR_DOWN_DESTRUTIVO=true.',
      );
    }
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const tabela of TABELAS) {
        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tabela}" CASCADE;`, { transaction });
      }
    });
  },
};
