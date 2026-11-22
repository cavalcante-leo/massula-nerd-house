import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { ConfirmDialog, KebabMenu, SkeletonList, StatusPill, useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { useAuthStore } from '@/features/auth/authStore';
import { levelsApi, type NivelJogoCatalogo } from '@/features/levels/levelsApi';

interface Props {
  idJogo: number;
}

export function GameLevels({ idJogo }: Props) {
  const isSuper = useAuthStore((s) => s.usuario?.tipo === 'superadmin');
  const toast = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [confirm, setConfirm] = useState<NivelJogoCatalogo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['game-levels', idJogo],
    queryFn: () => levelsApi.listarPorJogo(idJogo),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['game-levels', idJogo] });
  };

  const toggle = useMutation({
    mutationFn: (item: NivelJogoCatalogo) =>
      item.ativo ? levelsApi.desativar(item.id) : levelsApi.reativar(item.id),
    onSuccess: () => {
      invalidate();
      toast('Nível atualizado.');
      setConfirm(null);
    },
    onError: (err) => {
      toast(err instanceof ApiError ? err.message : 'Erro na operação.', 'error');
      setConfirm(null);
    },
  });

  return (
    <>
      <div className="section-title">
        <span>Níveis do jogo</span>
        {isSuper && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/jogos/${idJogo}/niveis/novo`)}>
            <Plus size={14} /> Novo nível
          </button>
        )}
      </div>

      <div className="card">
        {isLoading ? (
          <SkeletonList rows={2} />
        ) : (data ?? []).length === 0 ? (
          <div style={{ padding: 16 }}>
            <p className="tag">Nenhum nível cadastrado para este jogo.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Modelo</th>
                  <th>Jogadores</th>
                  <th>Status</th>
                  {isSuper && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="mono">Nível {item.nivel}</td>
                    <td>{item.modelo || '—'}</td>
                    <td className="mono">{item.jogadoresNivel?.length ?? 0}</td>
                    <td>
                      <StatusPill ativo={item.ativo} />
                    </td>
                    {isSuper && (
                      <td>
                        <KebabMenu
                          aria-label={`Ações do nível ${item.nivel}`}
                          items={[
                            {
                              label: 'Editar',
                              icon: <Pencil size={14} />,
                              onClick: () => navigate(`/jogos/${idJogo}/niveis/${item.id}/editar`),
                            },
                            item.ativo
                              ? {
                                  label: 'Desativar',
                                  icon: <Trash2 size={14} />,
                                  danger: true,
                                  onClick: () => setConfirm(item),
                                }
                              : {
                                  label: 'Reativar',
                                  icon: <RotateCcw size={14} />,
                                  onClick: () => toggle.mutate(item),
                                },
                          ]}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Desativar nível"
        message={`Desativar o nível ${confirm?.nivel}? Níveis com jogadores vinculados não podem ser desativados.`}
        confirmLabel="Desativar"
        onConfirm={() => confirm && toggle.mutate(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
