import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { EmptyState, SkeletonList } from '@/shared/ui';
import { avatarColor, iniciais, isoParaBR } from '@/shared/lib/format';
import { attendanceApi } from './attendanceApi';

export function AttendancePage() {
  const navigate = useNavigate();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', inicio, fim],
    queryFn: () => attendanceApi.listar(inicio || undefined, fim || undefined),
  });

  const total = data?.length ?? 0;

  return (
    <>
      <div className="stat-strip">
        <div className="card stat-box">
          <div className="n">{total}</div>
          <div className="l">Presenças no período</div>
        </div>
        <div className="card stat-box">
          <div className="n">{new Set((data ?? []).map((p) => p.id_jogador)).size}</div>
          <div className="l">Jogadores únicos</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          <input type="date" className="chip" value={inicio} onChange={(e) => setInicio(e.target.value)} title="De" />
          <span className="tag">até</span>
          <input type="date" className="chip" value={fim} onChange={(e) => setFim(e.target.value)} title="Até" />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/presencas/nova')}>
          <Plus size={15} /> Registrar presença
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <SkeletonList rows={4} />
        ) : total === 0 ? (
          <div style={{ padding: 16 }}>
            <EmptyState
              title="Nenhuma presença no período"
              description="Ajuste o intervalo de datas ou registre uma nova presença."
              action={
                <button className="btn btn-primary" onClick={() => navigate('/presencas/nova')}>
                  <Plus size={15} /> Registrar presença
                </button>
              }
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Jogador</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{isoParaBR(p.data_presenca)}</td>
                    <td>
                      <div className="name-cell">
                        <div className={`mini-avatar ${avatarColor(p.id_jogador)}`}>
                          {iniciais(p.jogador?.nome ?? '?')}
                        </div>
                        <div className="name-main">{p.jogador?.nome}</div>
                      </div>
                    </td>
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
