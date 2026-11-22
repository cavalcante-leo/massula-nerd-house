import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Spinner, useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { campoTypeLabel } from '@/shared/lib/format';
import { usePlayers } from '@/features/players/usePlayers';
import { useGame } from '@/features/games/useGames';
import { levelsApi } from '@/features/levels/levelsApi';
import { matchesApi } from './matchesApi';
import { useMatch, useParticipantes } from './useMatches';
import type { CampoConfig } from '@/shared/ui/DynamicFields';

export function ParticipantFormPage() {
  const { id, jogadorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(jogadorId);

  const { data: partida } = useMatch(id);
  const { data: participantes } = useParticipantes(id);
  const { data: jogo } = useGame(partida?.id_jogo);
  const { data: jogadores } = usePlayers(true);

  const campos: CampoConfig[] = jogo?.config_campos ?? [];

  const [idJogador, setIdJogador] = useState('');
  const [posicao, setPosicao] = useState('1');
  const [stats, setStats] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const participante = useMemo(
    () => (participantes ?? []).find((p) => String(p.id_jogador) === jogadorId),
    [participantes, jogadorId]
  );

  useEffect(() => {
    if (isEdit && participante) {
      setIdJogador(String(participante.id_jogador));
      setPosicao(String(participante.posicao_final ?? 1));
      const next: Record<string, string | boolean> = {};
      for (const campo of campos) {
        const v = participante.estatisticas?.[campo.nome];
        if (v === undefined || v === null) continue;
        next[campo.nome] = campo.tipo === 'numero' ? String(v) : (v as string | boolean);
      }
      setStats(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, participante, campos]);

  const setStat = (nome: string, tipo: CampoConfig['tipo'], raw: string | boolean) =>
    setStats((prev) => ({ ...prev, [nome]: tipo === 'numero' ? String(raw) : raw }));

  const salvar = async () => {
    if (!id) return;
    if (!isEdit && !idJogador) {
      toast('Selecione um jogador.', 'error');
      return;
    }
    setSaving(true);
    try {
      const idJogo = partida?.id_jogo as number;
      const nivelPadrao = partida?.nivelJogo?.nivel ?? 1;
      const jogador = Number(isEdit ? participante?.id_jogador : idJogador);

      if (!isEdit) {
        try {
          await levelsApi.obterNivel(jogador, idJogo);
        } catch {
          await levelsApi.definir(jogador, idJogo, nivelPadrao);
        }
        const pos = Number(posicao);
        await matchesApi.adicionarParticipante(id, jogador, pos);
      }

      const estatisticas: Record<string, unknown> = {};
      for (const campo of campos) {
        const raw = stats[campo.nome];
        if (raw === undefined || raw === '') continue;
        if (campo.tipo === 'numero') estatisticas[campo.nome] = Number(raw);
        else if (campo.tipo === 'booleano') estatisticas[campo.nome] = Boolean(raw);
        else estatisticas[campo.nome] = raw;
      }

      const pos = Number(posicao);
      await matchesApi.atualizarParticipante(id, jogador, {
        posicao_final: pos,
        estatisticas,
        vencedor: pos === 1,
      });

      toast(isEdit ? 'Resultado atualizado.' : 'Jogador adicionado à partida.');
      navigate(`/partidas/${id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && !participante) return <Spinner />;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(`/partidas/${id}`)}>
        <ArrowLeft size={14} /> Voltar para partida
      </button>

      <div className="card card-hero form-card">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          {isEdit ? 'Editar resultado' : 'Adicionar jogador'}
        </div>

        {!isEdit && (
          <div className="field">
            <label>Jogador *</label>
            <select value={idJogador} onChange={(e) => setIdJogador(e.target.value)}>
              <option value="">Selecione...</option>
              {(jogadores ?? [])
                .filter((j) => !(participantes ?? []).some((p) => p.id_jogador === j.id))
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nome}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Posição final *</label>
          <input type="number" min={1} value={posicao} onChange={(e) => setPosicao(e.target.value)} />
        </div>

        {campos.length > 0 && (
          <>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
              }}
            >
              Estatísticas
            </label>
            <div className="field-row" style={{ marginTop: 8 }}>
              {campos.map((campo) => (
                <div className="field" key={campo.nome}>
                  <label>
                    {campo.nome} ({campoTypeLabel(campo.tipo)})
                  </label>
                  {campo.tipo === 'booleano' ? (
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={Boolean(stats[campo.nome])}
                        onChange={(e) => setStat(campo.nome, 'booleano', e.target.checked)}
                      />
                      Sim
                    </label>
                  ) : (
                    <input
                      type={campo.tipo === 'numero' ? 'number' : 'text'}
                      value={String(stats[campo.nome] ?? '')}
                      onChange={(e) => setStat(campo.nome, campo.tipo, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

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
