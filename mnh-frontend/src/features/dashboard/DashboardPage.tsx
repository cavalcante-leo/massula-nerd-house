import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { usePlayers } from '@/features/players/usePlayers';
import { useGames } from '@/features/games/useGames';
import { useMatches } from '@/features/matches/useMatches';
import { RankPill, SkeletonList } from '@/shared/ui';
import { avatarColor, formatDateTimeBR, iniciais } from '@/shared/lib/format';

export function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const players = usePlayers();
  const games = useGames();
  const matches = useMatches();

  const recentes = (matches.data ?? []).slice(0, 5);
  const totalPresencas = (players.data ?? []).reduce(
    (acc, j) => acc + (j.total_presencas ?? 0),
    0
  );
  const destaque = [...(players.data ?? [])].sort(
    (a, b) => (b.patente ?? 0) - (a.patente ?? 0)
  )[0];

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi felt">
          <div className="num">{matches.data?.length ?? 0}</div>
          <div className="label">Total de partidas</div>
        </div>
        <div className="kpi dark">
          <div className="num">{totalPresencas}</div>
          <div className="label">Presenças registradas</div>
        </div>
        <div className="kpi red">
          <div className="num">{players.data?.length ?? 0}</div>
          <div className="label">Total de jogadores</div>
        </div>
        <div className="kpi wood">
          <div className="num">{games.data?.length ?? 0}</div>
          <div className="label">Jogos no catálogo</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div
          className="card card-hero"
          style={{
            padding: 20,
            background: 'var(--highlight)',
            borderColor: 'var(--ink)',
            color: 'var(--ink)',
          }}
        >
          <div className="tag" style={{ color: 'var(--ink)' }}>
            Jogador em destaque
          </div>
          {destaque ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <div className={`avatar big ${avatarColor(destaque.id)}`}>
                {iniciais(destaque.nome)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
                  {destaque.nome}
                </div>
                <div style={{ marginTop: 4 }}>
                  <RankPill patente={destaque.patente} />
                </div>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 10 }}>Cadastre jogadores para ver o destaque.</p>
          )}
        </div>

        <div className="card card-hero" style={{ padding: 20 }}>
          <div className="tag">Partidas recentes</div>
          {matches.isLoading ? (
            <SkeletonList rows={3} />
          ) : recentes.length === 0 ? (
            <p className="tag" style={{ marginTop: 10 }}>
              Nenhuma partida registrada ainda.
            </p>
          ) : (
            <div style={{ marginTop: 8 }}>
              {recentes.map((p) => (
                <Link
                  key={p.id}
                  to={`/partidas/${p.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--parchment-2)',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <span className="name-main">{p.jogo?.nome ?? 'Partida'}</span>
                  <span className="tag mono">{formatDateTimeBR(p.jogada_em)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="banner warn">
        Olá, {usuario?.nome}. As agregações avançadas do dashboard (RF-004/005/006) ainda não têm
        endpoint no backend — esta visão usa os dados disponíveis.
      </div>
    </>
  );
}

export default DashboardPage;
