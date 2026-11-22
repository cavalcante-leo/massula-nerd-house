import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, Pencil, Plus, Search, Trash2, RotateCcw } from 'lucide-react';
import { ConfirmDialog, EmptyState, KebabMenu, RankPill, SkeletonList, StatusPill } from '@/shared/ui';
import { avatarColor, iniciais } from '@/shared/lib/format';
import { usePlayers, useQuickPresence, useTogglePlayer } from './usePlayers';
import type { Jogador } from './playersApi';

type Filtro = 'todos' | 'ativos' | 'inativos';

export function PlayersPage() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>('ativos');
  const [busca, setBusca] = useState('');
  const [confirm, setConfirm] = useState<Jogador | null>(null);

  const ativoParam = filtro === 'ativos' ? true : filtro === 'inativos' ? false : undefined;
  const { data, isLoading } = usePlayers(ativoParam);
  const quickPresence = useQuickPresence();
  const toggle = useTogglePlayer();

  const jogadores = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (j) =>
        j.nome.toLowerCase().includes(term) ||
        (j.instagram ?? '').toLowerCase().includes(term) ||
        (j.telefone ?? '').toLowerCase().includes(term)
    );
  }, [data, busca]);

  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <div className="search">
            <Search size={15} color="var(--ink-soft)" />
            <input
              placeholder="Buscar jogador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          {(['todos', 'ativos', 'inativos'] as Filtro[]).map((f) => (
            <div
              key={f}
              className={`chip ${filtro === f ? 'active' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/jogadores/novo')}>
          <Plus size={15} /> Novo jogador
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <SkeletonList rows={5} />
        ) : jogadores.length === 0 ? (
          <div style={{ padding: 'var(--space-4)' }}>
            <EmptyState
              title={
                filtro === 'ativos'
                  ? 'Nenhum jogador ativo'
                  : filtro === 'inativos'
                  ? 'Nenhum jogador inativo'
                  : 'Nenhum jogador por aqui'
              }
              description={
                filtro === 'ativos'
                  ? 'Cadastre o primeiro membro do clube para começar.'
                  : filtro === 'inativos'
                  ? 'Jogadores desativados aparecem aqui e podem ser reativados.'
                  : 'Cadastre um novo jogador ou ajuste os filtros.'
              }
              action={
                <button className="btn btn-primary" onClick={() => navigate('/jogadores/novo')}>
                  <Plus size={15} /> Novo jogador
                </button>
              }
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th>Instagram</th>
                  <th>Telefone</th>
                  <th>Presenças</th>
                  <th>Patente</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {jogadores.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <Link
                        to={`/jogadores/${j.id}`}
                        className="name-cell"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div className={`mini-avatar ${avatarColor(j.id)}`}>
                          {iniciais(j.nome)}
                        </div>
                        <div>
                          <div className="name-main">{j.nome}</div>
                          <div className="name-sub">{j.ativo ? 'Membro ativo' : 'Inativo'}</div>
                        </div>
                      </Link>
                    </td>
                    <td>{j.instagram || '—'}</td>
                    <td>{j.telefone || '—'}</td>
                    <td className="mono">{j.total_presencas ?? 0}</td>
                    <td>
                      <RankPill patente={j.patente} />
                    </td>
                    <td>
                      <StatusPill ativo={j.ativo} />
                    </td>
                    <td>
                      <KebabMenu
                        aria-label={`Ações de ${j.nome}`}
                        items={[
                          {
                            label: 'Editar',
                            icon: <Pencil size={14} />,
                            onClick: () => navigate(`/jogadores/${j.id}/editar`),
                          },
                          ...(j.ativo
                            ? [
                                {
                                  label: 'Presença hoje',
                                  icon: <CalendarPlus size={14} />,
                                  onClick: () => quickPresence.mutate(j.id),
                                  disabled: quickPresence.isPending,
                                },
                                {
                                  label: 'Desativar',
                                  icon: <Trash2 size={14} />,
                                  danger: true,
                                  onClick: () => setConfirm(j),
                                },
                              ]
                            : [
                                {
                                  label: 'Reativar',
                                  icon: <RotateCcw size={14} />,
                                  onClick: () => toggle.mutate({ id: j.id, ativo: false }),
                                },
                              ]),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Desativar jogador"
        message={`Desativar ${confirm?.nome}? Ele deixará de aparecer na listagem padrão, mas pode ser reativado depois.`}
        confirmLabel="Desativar"
        onConfirm={() => {
          if (confirm) toggle.mutate({ id: confirm.id, ativo: true });
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
