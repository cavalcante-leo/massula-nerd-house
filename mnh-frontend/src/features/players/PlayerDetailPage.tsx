import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { RankPill, SkeletonList, StatusPill, useToast } from '@/shared/ui';
import { avatarColor, iniciais } from '@/shared/lib/format';
import { usePlayer, useQuickPresence } from './usePlayers';
import { levelsApi } from '@/features/levels/levelsApi';

export function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: jogador, isLoading } = usePlayer(id);
  const quickPresence = useQuickPresence();

  const niveis = useQuery({
    queryKey: ['player-levels', id],
    queryFn: () => levelsApi.listarPorJogador(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) return <SkeletonList rows={4} />;
  if (!jogador) return <p className="tag">Jogador não encontrado.</p>;

  const patente = jogador.patente ?? jogador.patente_calculada;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/jogadores')}>
        <ArrowLeft size={14} /> Voltar para jogadores
      </button>

      <div className="card card-hero" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`avatar big ${avatarColor(jogador.id)}`}>{iniciais(jogador.nome)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
              {jogador.nome}
            </div>
            <div className="tag" style={{ marginTop: 2 }}>
              {jogador.instagram || 'sem instagram'} · {jogador.telefone || 'sem telefone'}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <RankPill patente={patente} />
              <StatusPill ativo={jogador.ativo} />
              <span className="pill wood">{jogador.total_presencas ?? 0} presenças</span>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() =>
              quickPresence.mutate(jogador.id, {
                onSuccess: () => toast('Presença de hoje registrada.'),
              })
            }
            disabled={quickPresence.isPending}
          >
            <CalendarPlus size={15} /> Registrar presença
          </button>
        </div>
      </div>

      <div className="section-title">Níveis por jogo</div>
      <div className="card">
        {niveis.isLoading ? (
          <SkeletonList rows={2} />
        ) : (niveis.data ?? []).length === 0 ? (
          <div style={{ padding: 16 }}>
            <p className="tag">Nenhum nível registrado ainda.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jogo</th>
                  <th>Nível</th>
                </tr>
              </thead>
              <tbody>
                {(niveis.data ?? []).map((n) => (
                  <tr key={n.id}>
                    <td>
                      <Link
                        to={`/jogos/${n.nivelJogo.jogo?.id ?? ''}`}
                        style={{ color: 'var(--felt)', fontWeight: 600 }}
                      >
                        {n.nivelJogo.jogo?.nome ?? 'Jogo'}
                      </Link>
                    </td>
                    <td className="mono">{n.nivelJogo.nivel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
