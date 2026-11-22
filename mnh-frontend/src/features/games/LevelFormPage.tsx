import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Spinner, useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { levelsApi } from '@/features/levels/levelsApi';

export function LevelFormPage() {
  const { id, nivelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const isEdit = Boolean(nivelId);

  const { data: niveis, isLoading } = useQuery({
    queryKey: ['game-levels', id],
    queryFn: () => levelsApi.listarPorJogo(id as string),
  });

  const [nivel, setNivel] = useState('1');
  const [modelo, setModelo] = useState('');

  const editing = isEdit ? (niveis ?? []).find((n) => String(n.id) === nivelId) : undefined;

  useEffect(() => {
    if (editing) {
      setNivel(String(editing.nivel));
      setModelo(editing.modelo ?? '');
    }
  }, [editing]);

  const save = useMutation({
    mutationFn: () => {
      const payload = { id_jogo: Number(id), nivel: Number(nivel), modelo: modelo.trim() || undefined };
      return editing ? levelsApi.atualizar(editing.id, payload) : levelsApi.criar(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['game-levels', id] });
      toast(editing ? 'Nível atualizado.' : 'Nível criado.');
      navigate(`/jogos/${id}`);
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Erro ao salvar nível.', 'error'),
  });

  if (isEdit && isLoading) return <Spinner />;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(`/jogos/${id}`)}>
        <ArrowLeft size={14} /> Voltar para o jogo
      </button>

      <div className="card card-hero form-card">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          {isEdit ? 'Editar nível' : 'Novo nível'}
        </div>

        <div className="field-row">
          <div className="field">
            <label>Nível *</label>
            <input type="number" min={1} value={nivel} onChange={(e) => setNivel(e.target.value)} />
          </div>
          <div className="field">
            <label>Modelo</label>
            <input placeholder="Ex: Iniciante" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => navigate(`/jogos/${id}`)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
}
