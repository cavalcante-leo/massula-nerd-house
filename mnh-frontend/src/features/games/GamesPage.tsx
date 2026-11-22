import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, RotateCcw, Trash2 } from 'lucide-react';
import { ConfirmDialog, EmptyState, KebabMenu, SkeletonList, StatusPill } from '@/shared/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { useGames, useToggleGame } from './useGames';
import type { Jogo } from './gamesApi';

type Filtro = 'todos' | 'ativos' | 'inativos';

const COVERS = ['ac-felt', 'ac-red', 'ac-wood', 'ac-gold', 'ac-dark', 'ac-teal'];

export function GamesPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const isSuper = usuario?.tipo === 'superadmin';
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [confirm, setConfirm] = useState<Jogo | null>(null);

  const ativoParam = filtro === 'ativos' ? true : filtro === 'inativos' ? false : undefined;
  const { data, isLoading } = useGames(ativoParam);
  const toggle = useToggleGame();

  const jogos = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((j) => j.nome.toLowerCase().includes(term));
  }, [data, busca]);

  const emptyTitle =
    filtro === 'ativos'
      ? 'Nenhum jogo ativo'
      : filtro === 'inativos'
      ? 'Nenhum jogo inativo'
      : 'Nenhum jogo no catálogo';
  const emptyDesc =
    filtro === 'ativos'
      ? 'Registre um novo jogo para começar a marcar partidas.'
      : filtro === 'inativos'
      ? 'Jogos desativados aparecem aqui e podem ser reativados.'
      : 'Cadastre os jogos da casa para poder registrar partidas.';

  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <div className="search">
            <Search size={15} color="var(--ink-soft)" />
            <input placeholder="Buscar jogo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          {(['todos', 'ativos', 'inativos'] as Filtro[]).map((f) => (
            <div key={f} className={`chip ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
              {f[0].toUpperCase() + f.slice(1)}
            </div>
          ))}
        </div>
        {isSuper && (
          <button className="btn btn-primary" onClick={() => navigate('/jogos/novo')}>
            <Plus size={15} /> Novo jogo
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : jogos.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDesc}
          action={
            isSuper ? (
              <button className="btn btn-primary" onClick={() => navigate('/jogos/novo')}>
                <Plus size={15} /> Registrar novo jogo
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="game-grid">
          {jogos.map((j, i) => (
            <div className="card game-card card-sticker" key={j.id}>
              <div className={`game-cover ${COVERS[i % COVERS.length]}`}>{j.nome.slice(0, 3)}</div>
              <div className="game-body">
                <div className="game-title">{j.nome}</div>
                <div className="game-meta">
                  <span className="tag">{j.config_campos?.length ?? 0} campos</span>
                  <StatusPill ativo={j.ativo} />
                </div>
                <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/jogos/${j.id}`)}>
                    Ver
                  </button>
                  {isSuper && (
                    <KebabMenu
                      aria-label={`Ações de ${j.nome}`}
                      items={[
                        { label: 'Editar', icon: <Pencil size={14} />, onClick: () => navigate(`/jogos/${j.id}/editar`) },
                        j.ativo
                          ? { label: 'Desativar', icon: <Trash2 size={14} />, danger: true, onClick: () => setConfirm(j) }
                          : { label: 'Reativar', icon: <RotateCcw size={14} />, onClick: () => toggle.mutate({ id: j.id, ativo: false }) },
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Desativar jogo"
        message={`Desativar ${confirm?.nome}? O jogo deixa de aparecer nas listagens ativas, mas pode ser reativado.`}
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
