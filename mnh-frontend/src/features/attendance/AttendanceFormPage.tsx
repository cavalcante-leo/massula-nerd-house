import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { brParaISO, hojeBR, isoParaBR } from '@/shared/lib/format';
import { usePlayers } from '@/features/players/usePlayers';
import { attendanceApi } from './attendanceApi';

export function AttendanceFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: jogadores } = usePlayers(true);
  const [idJogador, setIdJogador] = useState('');
  const [data, setData] = useState(brParaISO(hojeBR()));

  const mutation = useMutation({
    mutationFn: () => attendanceApi.registrar(idJogador, isoParaBR(data)),
    onSuccess: () => {
      toast('Presença registrada.');
      navigate('/presencas');
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Erro ao registrar presença.', 'error'),
  });

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/presencas')}>
        <ArrowLeft size={14} /> Voltar para presenças
      </button>

      <div className="card card-hero form-card">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          Registrar presença
        </div>

        <div className="field">
          <label>Jogador *</label>
          <select value={idJogador} onChange={(e) => setIdJogador(e.target.value)}>
            <option value="">Selecione...</option>
            {(jogadores ?? []).map((j) => (
              <option key={j.id} value={j.id}>
                {j.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Data * (dd/mm/aaaa)</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/presencas')}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => (idJogador ? mutation.mutate() : toast('Selecione um jogador.', 'error'))}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </>
  );
}
