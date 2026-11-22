// Opções de conexão compartilhadas entre o runtime (database.js) e o sequelize-cli.

const lerBooleano = (valor) => ['1', 'true', 'yes'].includes(String(valor || '').trim().toLowerCase());

const lerInteiro = (valor, padrao) => {
  const numero = Number.parseInt(valor, 10);
  return Number.isInteger(numero) && numero >= 0 ? numero : padrao;
};

// SSL é fail-closed: com DB_SSL=true o certificado do servidor é sempre verificado.
// Para o Supabase, informe a CA em DB_SSL_CA (conteúdo PEM; "\n" literais são aceitos).
const montarSsl = () => {
  if (!lerBooleano(process.env.DB_SSL)) return undefined;

  const ssl = { require: true, rejectUnauthorized: true };
  if (process.env.DB_SSL_CA) {
    ssl.ca = process.env.DB_SSL_CA.replace(/\\n/g, '\n');
  }
  return ssl;
};

const montarDialectOptions = () => {
  const dialectOptions = {
    connectionTimeoutMillis: 10000, // 10 segundos (opção do driver pg)
  };
  const ssl = montarSsl();
  if (ssl) dialectOptions.ssl = ssl;
  return dialectOptions;
};

// Padrões para servidor contínuo (ex.: Render): conexões reaproveitadas por 30s para evitar
// pagar o handshake TCP+TLS a cada requisição. Em serverless, use DB_POOL_MAX=1 ou 2.
const montarPool = () => ({
  max: lerInteiro(process.env.DB_POOL_MAX, 5) || 5,
  min: lerInteiro(process.env.DB_POOL_MIN, 0),
  acquire: 10000,
  idle: 30000,
  evict: 10000,
});

module.exports = {
  montarSsl,
  montarDialectOptions,
  montarPool,
};
