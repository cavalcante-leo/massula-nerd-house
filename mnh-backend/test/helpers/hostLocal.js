const HOSTS_LOCAIS = ['localhost', '127.0.0.1', '[::1]'];

// Barreira contra rodar testes (que criam e apagam dados) num banco remoto, como o Supabase.
const garantirHostLocal = (url, nomeVariavel) => {
  const { hostname } = new URL(url);
  if (!HOSTS_LOCAIS.includes(hostname)) {
    throw new Error(`Testes só rodam contra Postgres local; ${nomeVariavel} aponta para "${hostname}".`);
  }
};

module.exports = { garantirHostLocal };
