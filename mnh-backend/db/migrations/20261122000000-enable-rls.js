'use strict';

// Habilita Row Level Security em todas as tabelas, SEM policies.
// No Supabase, o schema public é exposto pela Data API (anon/authenticated); sem RLS,
// qualquer um com a anon key leria/gravaria as tabelas (inclusive usuario.senha_hash).
// O backend conecta como dono das tabelas, que ignora RLS, então nada muda para a API.
const TABELAS = [
  'usuario',
  'jogo',
  'partida',
  'partida_resultado',
  'jogador',
  'jogador_presenca',
  'jogador_nivel_jogo',
  'nivel_jogo',
  'SequelizeMeta',
  'SequelizeData',
];

// SequelizeData só existe depois do primeiro seed; tabelas ausentes são ignoradas.
const alterarRls = async (queryInterface, acao) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    for (const tabela of TABELAS) {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
           IF to_regclass('public."${tabela}"') IS NOT NULL THEN
             EXECUTE 'ALTER TABLE public."${tabela}" ${acao} ROW LEVEL SECURITY';
           END IF;
         END $$;`,
        { transaction },
      );
    }
  });
};

module.exports = {
  async up(queryInterface) {
    await alterarRls(queryInterface, 'ENABLE');
  },

  async down(queryInterface) {
    await alterarRls(queryInterface, 'DISABLE');
  },
};
