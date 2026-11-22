import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog, KebabMenu, SkeletonList, useToast } from '@/shared/ui';
import { avatarColor, formatDateTimeBR, iniciais } from '@/shared/lib/format';
import { usePlayers } from '@/features/players/usePlayers';
import { useGame } from '@/features/games/useGames';
import type { CampoConfig } from '@/shared/ui/DynamicFields';
import type { Participante } from './matchesApi';
import { useMatch, useParticipantes, useRemoveParticipant } from './useMatches';

export function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: partida, isLoading } = useMatch(id);
  const { data: participantes } = useParticipantes(id);
  const { data: jogo } = useGame(partida?.id_jogo);
  const { data: jogadores } = usePlayers(true);
  const removeParticipante = useRemoveParticipant(id);

  const [confirm, setConfirm] = useState<Participante | null>(null);

  const campos: CampoConfig[] = jogo?.config_campos ?? [];

  const ranking = useMemo(
    () =>
      [...(participantes ?? [])].sort(
        (a, b) => (a.posicao_final ?? 999) - (b.posicao_final ?? 999)
      ),
    [participantes]
  );

  if (isLoading) return <SkeletonList rows={4} />;
  if (!partida) return <p className="tag">Partida não encontrada.</p>;

  const [p1, p2, p3] = ranking;

  const renderCell = (p: Participante, c: CampoConfig) => {
    const v = p.estatisticas?.[c.nome];
    if (c.tipo === 'booleano') return v ? '✓' : '—';
    if (v === undefined || v === null) return '—';
    return String(v);
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/partidas')}>
        <ArrowLeft size={14} /> Voltar para partidas
      </button>

      <div className="card card-hero" style={{ padding: 18, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
              {partida.jogo?.nome ?? 'Partida'} · Nível {partida.nivelJogo?.nivel ?? '—'}
            </div>
            <div className="tag" style={{ marginTop: 2 }}>
              {formatDateTimeBR(partida.jogada_em)} · {ranking.length} participante(s)
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/partidas/${partida.id}/editar`)}>
            <Pencil size={14} /> Editar
          </button>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="podium">
          {p2 && (
            <div className="block b2">
              <div className="pos">2º</div>
              <div className="pname">{p2.jogador?.nome}</div>
            </div>
          )}
          {p1 && (
            <div className="block b1">
              <div className="pos">1º</div>
              <div className="pname">{p1.jogador?.nome}</div>
            </div>
          )}
          {p3 && (
            <div className="block b3">
              <div className="pos">3º</div>
              <div className="pname">{p3.jogador?.nome}</div>
            </div>
          )}
        </div>
      )}

      <div className="toolbar">
        <div className="section-title" style={{ margin: 0 }}>
          Participantes
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/partidas/${partida.id}/jogadores/novo`)}>
          <Plus size={14} /> Adicionar jogador
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Jogador</th>
                <th>Vencedor</th>
                {campos.map((c) => (
                  <th key={c.nome}>{c.nome}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={4 + campos.length} className="tag">
                    Nenhum participante ainda.
                  </td>
                </tr>
              ) : (
                ranking.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.posicao_final ?? '—'}</td>
                    <td>
                      <div className="name-cell">
                        <div className={`mini-avatar ${avatarColor(p.id_jogador)}`}>
                          {iniciais(p.jogador?.nome ?? '?')}
                        </div>
                        <div className="name-main">{p.jogador?.nome}</div>
                      </div>
                    </td>
                    <td>{p.vencedor ? '✓' : '—'}</td>
                    {campos.map((c) => (
                      <td key={c.nome} className="mono">
                        {renderCell(p, c)}
                      </td>
                    ))}
                    <td>
                      <KebabMenu
                        aria-label={`Ações de ${p.jogador?.nome ?? 'participante'}`}
                        items={[
                          {
                            label: 'Editar resultado',
                            icon: <Pencil size={14} />,
                            onClick: () => navigate(`/partidas/${partida.id}/jogadores/${p.id_jogador}/editar`),
                          },
                          {
                            label: 'Remover',
                            icon: <Trash2 size={14} />,
                            danger: true,
                            onClick: () => setConfirm(p),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remover participante"
        message={`Remover ${confirm?.jogador?.nome ?? 'este jogador'} da partida?`}
        confirmLabel="Remover"
        onConfirm={() => {
          if (confirm) removeParticipante.mutate(confirm.id_jogador);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />

      <div style={{ marginTop: 16 }}>
        <span className="tag" onClick={() => toast(`Ranking com ${ranking.length} participante(s).`)}>
          {jogadores?.length ?? 0} jogador(es) disponíveis no clube.
        </span>
      </div>
    </>
  );
}
