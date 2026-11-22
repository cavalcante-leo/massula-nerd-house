import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Spinner, useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { useGames } from '@/features/games/useGames';
import { matchesApi } from './matchesApi';
import { useMatch } from './useMatches';

export function MatchEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: partida, isLoading } = useMatch(id);
  const { data: jogos } = useGames(true);

  const [idJogo, setIdJogo] = useState('');
  const [nivel, setNivel] = useState('1');
  const [jogadaEm, setJogadaEm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (partida) {
      setIdJogo(String(partida.id_jogo));
      setNivel(String(partida.nivelJogo?.nivel ?? 1));
      const d = new Date(partida.jogada_em);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        setJogadaEm(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
    }
  }, [partida]);

  const salvar = async () => {
    if (!id || !idJogo || !nivel || !jogadaEm) {
      toast('Preencha jogo, nível e data/hora.', 'error');
      return;
    }
    setSaving(true);
    try {
      await matchesApi.atualizar(id, {
        id_jogo: Number(idJogo),
        nivel: Number(nivel),
        jogada_em: new Date(jogadaEm).toISOString(),
      });
      toast('Partida atualizada.');
      navigate(`/partidas/${id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao atualizar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(`/partidas/${id}`)}>
        <ArrowLeft size={14} /> Voltar para partida
      </button>

      <div className="card card-hero form-card">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          Editar partida
        </div>

        <div className="field">
          <label>Jogo *</label>
          <select value={idJogo} onChange={(e) => setIdJogo(e.target.value)}>
            <option value="">Selecione...</option>
            {(jogos ?? []).map((j) => (
              <option key={j.id} value={j.id}>
                {j.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Nível *</label>
            <input type="number" min={1} value={nivel} onChange={(e) => setNivel(e.target.value)} />
          </div>
          <div className="field">
            <label>Data e hora *</label>
            <input type="datetime-local" value={jogadaEm} onChange={(e) => setJogadaEm(e.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => navigate(`/partidas/${id}`)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </>
  );
}
