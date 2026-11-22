// Ponto de entrada do `npm test`: prepara UM banco descartável compartilhado por todos os
// arquivos de teste, roda o `node --test` em série e apaga o banco no fim (mesmo com falha).
//
// Nunca usa o .env: as variáveis do app são definidas aqui e herdadas pelos processos de teste,
// para que um .env apontando para o Supabase não seja tocado.
//
// Uso: npm test                       (todos os arquivos test/**/*.test.js)
//      npm test -- test/smoke.test.js (só os arquivos indicados)
const { execFileSync, spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const { Client } = require('pg');
const { garantirHostLocal } = require('./helpers/hostLocal');

const RAIZ = path.join(__dirname, '..');
const CLI = path.join(RAIZ, 'node_modules', 'sequelize-cli', 'lib', 'sequelize');
const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL
  || 'postgresql://mnhuser:senha@localhost:5432/postgres';

const executarNoAdmin = async (sql) => {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
};

const criarSuperadmin = async (env) => {
  const client = new Client({ connectionString: env.TEST_DATABASE_URL });
  await client.connect();
  try {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(env.TEST_SUPERADMIN_SENHA, 4);
    const { rows } = await client.query(
      `INSERT INTO usuario (nome, nome_usuario, senha_hash, tipo, ativo, criado_em, atualizado_em)
       VALUES ('Superadmin de Teste', $1, $2, 'superadmin', true, now(), now()) RETURNING id`,
      [env.TEST_SUPERADMIN_USUARIO, hash],
    );
    return rows[0].id;
  } finally {
    await client.end();
  }
};

const rodarTestes = (env) => new Promise((resolve) => {
  const arquivos = process.argv.slice(2);
  const args = ['--test', '--test-concurrency=1', ...(arquivos.length ? arquivos : ['test/**/*.test.js'])];
  const filho = spawn(process.execPath, args, { cwd: RAIZ, env, stdio: 'inherit' });
  // Ctrl+C também chega ao filho; aqui só esperamos ele sair para o `finally` apagar o banco.
  process.on('SIGINT', () => {});
  filho.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
});

const main = async () => {
  garantirHostLocal(ADMIN_URL, 'TEST_DATABASE_ADMIN_URL');

  const nomeBanco = `mnh_api_test_${process.pid}`;
  const url = new URL(ADMIN_URL);
  url.pathname = `/${nomeBanco}`;

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    TEST_DATABASE_URL: url.toString(),
    DATABASE_URL: url.toString(),
    DIRECT_URL: url.toString(),
    DB_SSL: 'false',
    DB_SSL_CA: '',
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    TEST_SUPERADMIN_USUARIO: 'super_teste',
    TEST_SUPERADMIN_SENHA: crypto.randomBytes(12).toString('hex'),
  };

  await executarNoAdmin(`DROP DATABASE IF EXISTS "${nomeBanco}" WITH (FORCE)`);
  await executarNoAdmin(`CREATE DATABASE "${nomeBanco}"`);
  try {
    execFileSync(process.execPath, [CLI, 'db:migrate'], { cwd: RAIZ, env, stdio: 'pipe' });
    env.TEST_SUPERADMIN_ID = String(await criarSuperadmin(env));
    return await rodarTestes(env);
  } finally {
    await executarNoAdmin(`DROP DATABASE IF EXISTS "${nomeBanco}" WITH (FORCE)`);
  }
};

main()
  .then((code) => { process.exitCode = code; })
  .catch((err) => {
    console.error('Falha ao preparar os testes:', err.stderr?.toString() || err.message);
    process.exitCode = 1;
  });
