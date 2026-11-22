import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SkeletonList, StatusPill } from '@/shared/ui';
import { campoTypeLabel } from '@/shared/lib/format';
import { useGame } from './useGames';
import { GameLevels } from './GameLevels';

export function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: jogo, isLoading } = useGame(id);

  if (isLoading) return <SkeletonList rows={4} />;
  if (!jogo) return <p className="tag">Jogo não encontrado.</p>;

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/jogos')}
      >
        <ArrowLeft size={14} /> Voltar para jogos
      </button>

      <div className="card card-hero" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800 }}>
              {jogo.nome}
            </div>
            <p className="tag" style={{ margin: '6px 0 12px 0' }}>
              {jogo.descricao || 'Sem descrição.'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {(jogo.config_campos ?? []).map((c, i) => (
                <span key={i} className="chip">
                  {c.nome} · {campoTypeLabel(c.tipo)}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill ativo={jogo.ativo} />
              <span className="pill wood">{jogo.total_partidas ?? 0} partidas</span>
            </div>
          </div>
        </div>
      </div>

      <GameLevels idJogo={jogo.id} />

      <div style={{ marginTop: 20 }}>
        <Link className="btn btn-ghost btn-sm" to={`/partidas/nova?jogo=${jogo.id}`}>
          Registrar partida deste jogo
        </Link>
      </div>
    </>
  );
}
