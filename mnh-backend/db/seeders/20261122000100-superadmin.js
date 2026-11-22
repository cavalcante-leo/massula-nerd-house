'use strict';

// Cria o superadmin inicial a partir de variáveis de ambiente (nunca versionadas).
// Idempotente: não faz nada se já existir um superadmin ativo.
// Mesmas regras do cadastro via API (usuario.controller.js): senha >= 8, bcrypt custo 10.
const bcrypt = require('bcrypt');

const SENHA_MIN = 8;
const BCRYPT_CUSTO = 10;

const lerEntrada = () => {
  const nome = (process.env.SEED_SUPERADMIN_NOME || '').trim();
  const nomeUsuario = (process.env.SEED_SUPERADMIN_USUARIO || '').trim();
  const senha = process.env.SEED_SUPERADMIN_SENHA || '';

  const faltando = [
    ['SEED_SUPERADMIN_NOME', nome],
    ['SEED_SUPERADMIN_USUARIO', nomeUsuario],
    ['SEED_SUPERADMIN_SENHA', senha],
  ].filter(([, valor]) => !valor).map(([chave]) => chave);

  if (faltando.length) {
    throw new Error(`Variáveis obrigatórias para o seed ausentes: ${faltando.join(', ')}`);
  }
  if (senha.length < SENHA_MIN) {
    throw new Error(`SEED_SUPERADMIN_SENHA deve ter pelo menos ${SENHA_MIN} caracteres.`);
  }
  return { nome, nomeUsuario, senha };
};

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    // A tabela de controle de seeders é criada pelo CLI antes deste up e nasce sem RLS.
    await sequelize.query('ALTER TABLE public."SequelizeData" ENABLE ROW LEVEL SECURITY');

    await sequelize.transaction(async (transaction) => {
      const [[{ existe }]] = await sequelize.query(
        "SELECT EXISTS (SELECT 1 FROM usuario WHERE tipo = 'superadmin' AND ativo) AS existe",
        { transaction },
      );
      if (existe) {
        console.log('Seed superadmin: já existe superadmin ativo, nada a fazer.');
        return;
      }

      const { nome, nomeUsuario, senha } = lerEntrada();
      const [[{ ocupado }]] = await sequelize.query(
        'SELECT EXISTS (SELECT 1 FROM usuario WHERE nome_usuario = :nomeUsuario) AS ocupado',
        { replacements: { nomeUsuario }, transaction },
      );
      if (ocupado) {
        throw new Error(`Nome de usuário "${nomeUsuario}" já existe e não é superadmin ativo; escolha outro.`);
      }

      const agora = new Date();
      await queryInterface.bulkInsert('usuario', [{
        nome,
        nome_usuario: nomeUsuario,
        senha_hash: await bcrypt.hash(senha, BCRYPT_CUSTO),
        tipo: 'superadmin',
        ativo: true,
        criado_em: agora,
        atualizado_em: agora,
      }], { transaction });
      console.log(`Seed superadmin: usuário "${nomeUsuario}" criado.`);
    });
  },

  // Remove o superadmin do seed. Falha (FK NO ACTION) se ele já criou registros — de propósito.
  async down(queryInterface) {
    const nomeUsuario = (process.env.SEED_SUPERADMIN_USUARIO || '').trim();
    if (!nomeUsuario) throw new Error('Defina SEED_SUPERADMIN_USUARIO para reverter o seed.');
    await queryInterface.bulkDelete('usuario', { nome_usuario: nomeUsuario, tipo: 'superadmin' });
  },
};
