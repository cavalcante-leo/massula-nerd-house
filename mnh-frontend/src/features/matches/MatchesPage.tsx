import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { ConfirmDialog, EmptyState, KebabMenu, SkeletonList, useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { formatDateTimeBR, isoParaBR } from '@/shared/lib/format';
import { useGames } from '@/features/games/useGames';
import { useDeleteMatch, useMatches } from './useMatches';
import type { Partida } from './matchesApi';

export function MatchesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [confirm, setConfirm] = useState<Partida | null>(null);

  const idJogo = params.get('id_jogo') ?? '';
  const inicio = params.get('inicio') ?? '';
  const fim = params.get('fim') ?? '';

  const { data: jogos } = useGames();
  const filtros = useMemo(
    () => ({ id_jogo: idJogo || undefined, jogada_em_inicio: inicio || undefined, jogada_em_fim: fim || undefined }),
    [idJogo, inicio, fim]
  );
  const { data, isLoading } = useMatches(filtros);
  const remove = useDeleteMatch();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const grupos = useMemo(() => {
    const map = new Map<string, Partida[]>();
    for (const p of data ?? []) {
      const key = isoParaBR(p.jogada_em);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [data]);

  const handleDelete = () => {
    if (!confirm) return;
    remove.mutate(confirm.id, {
      onSuccess: () => setConfirm(null),
      onError: (err) => {
        toast(err instanceof ApiError ? err.message : 'Erro ao remover.', 'error');
        setConfirm(null);
      },
    });
  };

  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <select className="chip" value={idJogo} onChange={(e) => setParam('id_jogo', e.target.value)}>
            <option value="">Jogo: Todos</option>
            {(jogos ?? []).map((j) => (
              <option key={j.id} value={j.id}>
                {j.nome}
              </option>
            ))}
          </select>
          <input type="date" className="chip" value={inicio} onChange={(e) => setParam('inicio', e.target.value)} title="De" />
          <span className="tag">até</span>
          <input type="date" className="chip" value={fim} onChange={(e) => setParam('fim', e.target.value)} title="Até" />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/partidas/nova')}>
          <Plus size={15} /> Nova partida
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <SkeletonList rows={4} />
        ) : (data ?? []).length === 0 ? (
          <div style={{ padding: 'var(--space-4)' }}>
            <EmptyState
              title="Nenhuma partida registrada"
              description="Que tal começar a primeira mesa da noite?"
              action={
                <button className="btn btn-primary" onClick={() => navigate('/partidas/nova')}>
                  <Plus size={15} /> Nova partida
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="table-wrap match-table-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Jogo</th>
                    <th>Nível</th>
                    <th>Jogadores</th>
                    <th>Vencedor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(([dateKey, partidas]) => (
                    <PartidaRows key={dateKey} dateKey={dateKey} partidas={partidas} onView={(id) => navigate(`/partidas/${id}`)} onEdit={(id) => navigate(`/partidas/${id}/editar`)} onDelete={setConfirm} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="match-list" style={{ padding: 'var(--space-4)' }}>
              {grupos.map(([dateKey, partidas]) => (
                <div key={dateKey}>
                  <div className="match-group-date">{dateKey}</div>
                  {partidas.map((p) => (
                    <div className="match-card" key={p.id}>
                      <div className="match-head">
                        <div>
                          <div className="name-main">{p.jogo?.nome ?? 'Partida'}</div>
                          <div className="tag">Nível {p.nivelJogo?.nivel ?? '—'} · {formatDateTimeBR(p.jogada_em)}</div>
                        </div>
                        <KebabMenu
                          aria-label={`Ações da partida ${p.id}`}
                          items={[
                            { label: 'Ver', icon: <Eye size={14} />, onClick: () => navigate(`/partidas/${p.id}`) },
                            { label: 'Editar', icon: <Pencil size={14} />, onClick: () => navigate(`/partidas/${p.id}/editar`) },
                            { label: 'Excluir', icon: <Trash2 size={14} />, danger: true, onClick: () => setConfirm(p) },
                          ]}
                        />
                      </div>
                      <div className="match-meta">
                        <span className="pill grey">{p.total_jogadores ?? 0} jogadores</span>
                        {p.vencedor && <span className="winner-badge"><Trophy size={13} /> {p.vencedor}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Excluir partida"
        message="Esta ação remove a partida e seus resultados. Deseja continuar?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function PartidaRows({
  dateKey,
  partidas,
  onView,
  onEdit,
  onDelete,
}: {
  dateKey: string;
  partidas: Partida[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (p: Partida) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={6} style={{ background: 'var(--surface-2)', fontWeight: 700 }} className="mono">
          {dateKey}
        </td>
      </tr>
      {partidas.map((p) => (
        <tr key={p.id}>
          <td className="mono">{formatDateTimeBR(p.jogada_em)}</td>
          <td>{p.jogo?.nome ?? '—'}</td>
          <td className="mono">{p.nivelJogo?.nivel ?? '—'}</td>
          <td className="mono">{p.total_jogadores ?? 0}</td>
          <td>{p.vencedor ? <span className="winner-name"><Trophy size={13} /> {p.vencedor}</span> : '—'}</td>
          <td>
            <KebabMenu
              aria-label={`Ações da partida ${p.id}`}
              items={[
                { label: 'Ver', icon: <Eye size={14} />, onClick: () => onView(p.id) },
                { label: 'Editar', icon: <Pencil size={14} />, onClick: () => onEdit(p.id) },
                { label: 'Excluir', icon: <Trash2 size={14} />, danger: true, onClick: () => onDelete(p) },
              ]}
            />
          </td>
        </tr>
      ))}
    </>
  );
}
