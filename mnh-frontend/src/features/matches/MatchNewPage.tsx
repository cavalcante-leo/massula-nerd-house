import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Spinner, useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { campoTypeLabel } from '@/shared/lib/format';
import { useGames } from '@/features/games/useGames';
import { usePlayers } from '@/features/players/usePlayers';
import { levelsApi } from '@/features/levels/levelsApi';
import { matchesApi } from './matchesApi';
import type { CampoConfig } from '@/shared/ui/DynamicFields';

interface Linha {
  id_jogador: number;
  posicao_final: number;
  estatisticas: Record<string, string | boolean>;
}

export function MatchNewPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { data: jogos, isLoading: loadingJogos } = useGames(true);
  const { data: jogadores } = usePlayers(true);

  const [idJogo, setIdJogo] = useState(params.get('jogo') ?? '');
  const [nivel, setNivel] = useState('1');
  const [jogadaEm, setJogadaEm] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [saving, setSaving] = useState(false);

  const jogo = useMemo(() => (jogos ?? []).find((j) => String(j.id) === idJogo), [jogos, idJogo]);
  const campos: CampoConfig[] = jogo?.config_campos ?? [];

  const addLinha = () =>
    setLinhas((prev) => [
      ...prev,
      { id_jogador: 0, posicao_final: prev.length + 1, estatisticas: {} },
    ]);

  const updateLinha = (index: number, patch: Partial<Linha>) =>
    setLinhas((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const removeLinha = (index: number) =>
    setLinhas((prev) => prev.filter((_, i) => i !== index));

  const setStat = (index: number, nome: string, tipo: CampoConfig['tipo'], raw: string | boolean) => {
    setLinhas((prev) =>
      prev.map((l, i) =>
        i === index
          ? { ...l, estatisticas: { ...l.estatisticas, [nome]: tipo === 'numero' ? String(raw) : raw } }
          : l
      )
    );
  };

  const salvar = async () => {
    if (!idJogo || !nivel || !jogadaEm) {
      toast('Preencha jogo, nível e data/hora.', 'error');
      return;
    }
    setSaving(true);
    try {
      const partida = await matchesApi.criar({
        id_jogo: Number(idJogo),
        nivel: Number(nivel),
        jogada_em: new Date(jogadaEm).toISOString(),
      });

      const validas = linhas.filter((l) => l.id_jogador > 0);
      for (const linha of validas) {
        try {
          await levelsApi.obterNivel(linha.id_jogador, idJogo);
        } catch {
          await levelsApi.definir(linha.id_jogador, idJogo, Number(nivel));
        }

        await matchesApi.adicionarParticipante(partida.id, linha.id_jogador, linha.posicao_final);

        const estatisticas: Record<string, unknown> = {};
        for (const campo of campos) {
          const raw = linha.estatisticas[campo.nome];
          if (raw === undefined || raw === '') continue;
          if (campo.tipo === 'numero') estatisticas[campo.nome] = Number(raw);
          else if (campo.tipo === 'booleano') estatisticas[campo.nome] = Boolean(raw);
          else estatisticas[campo.nome] = raw;
        }

        await matchesApi.atualizarParticipante(partida.id, linha.id_jogador, {
          posicao_final: linha.posicao_final,
          estatisticas,
          vencedor: linha.posicao_final === 1,
        });
      }

      toast('Partida registrada.');
      navigate(`/partidas/${partida.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao salvar partida.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingJogos) return <Spinner />;

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/partidas')}>
        <ArrowLeft size={14} /> Voltar para partidas
      </button>

      <div className="card card-hero form-card-wide">
        <div className="section-title" style={{ margin: 0, marginBottom: 20 }}>
          Nova partida
        </div>

        <div className="field-row">
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
          <div className="field">
            <label>Nível *</label>
            <input type="number" min={1} value={nivel} onChange={(e) => setNivel(e.target.value)} />
          </div>
          <div className="field">
            <label>Data e hora *</label>
            <input type="datetime-local" value={jogadaEm} onChange={(e) => setJogadaEm(e.target.value)} />
          </div>
        </div>

        <div className="section-title" style={{ marginTop: 24 }}>
          <span>Participantes</span>
        </div>
        <p className="hint" style={{ marginBottom: 16 }}>
          Jogadores sem nível definido para <strong>{jogo?.nome ?? 'o jogo'}</strong> recebem o nível {nivel} automaticamente.
        </p>

        {linhas.map((linha, i) => (
          <div key={i} className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div className="field-row">
              <div className="field">
                <label>Jogador *</label>
                <select
                  value={linha.id_jogador}
                  onChange={(e) => updateLinha(i, { id_jogador: Number(e.target.value) })}
                >
                  <option value={0}>Selecione...</option>
                  {(jogadores ?? []).map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ maxWidth: 130 }}>
                <label>Posição *</label>
                <input
                  type="number"
                  min={1}
                  value={linha.posicao_final}
                  onChange={(e) => updateLinha(i, { posicao_final: Number(e.target.value) })}
                />
              </div>
            </div>

            {campos.length > 0 && (
              <div className="field-row">
                {campos.map((campo) => (
                  <div className="field" key={campo.nome}>
                    <label>
                      {campo.nome} ({campoTypeLabel(campo.tipo)})
                    </label>
                    {campo.tipo === 'booleano' ? (
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(linha.estatisticas[campo.nome])}
                          onChange={(e) => setStat(i, campo.nome, 'booleano', e.target.checked)}
                        />
                        Sim
                      </label>
                    ) : (
                      <input
                        type={campo.tipo === 'numero' ? 'number' : 'text'}
                        value={String(linha.estatisticas[campo.nome] ?? '')}
                        onChange={(e) => setStat(i, campo.nome, campo.tipo, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tag">{linha.posicao_final === 1 ? '🏆 Vencedor' : 'Participante'}</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLinha(i)}>
                <Trash2 size={13} /> Remover
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-ghost" onClick={addLinha}>
          <Plus size={15} /> Adicionar jogador
        </button>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/partidas')}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar partida'}
          </button>
        </div>
      </div>
    </>
  );
}
