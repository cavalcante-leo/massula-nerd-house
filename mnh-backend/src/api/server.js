require('dotenv').config();
const http = require('http');
const app = require('./app');
const sequelize = require('./config/database');
const { problemaNoSegredoJwt } = require('./config/jwt');

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const faltando = REQUIRED_ENV.filter((k) => !process.env[k]);
if (faltando.length) {
  console.error(`Variáveis de ambiente obrigatórias ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}

const problemaJwt = problemaNoSegredoJwt(process.env.JWT_SECRET, process.env.NODE_ENV);
if (problemaJwt) {
  console.error(`${problemaJwt} Gere um com: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('- Banco de Dados Conectado');
    server.listen(PORT, () => {
      console.log(`- Servidor rodando na porta: ${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
};

start();
