import { http } from '@/shared/api/httpClient';

export interface Partida {
  id: number;
  id_jogo: number;
  id_nivel_jogo: number | null;
  jogada_em: string;
  ativo: boolean;
  jogo?: { id: number; nome: string };
  nivelJogo?: { id: number; nivel: number; modelo?: string | null };
  criado_por?: number;
  vencedor?: string | null;
  total_jogadores?: number;
}

export interface Participante {
  id: number;
  id_partida: number;
  id_jogador: number;
  posicao_final: number | null;
  vencedor: boolean;
  estatisticas: Record<string, unknown>;
  jogador?: { id: number; nome: string };
}

export interface PartidaFiltros {
  id_jogo?: string;
  id_nivel_jogo?: string;
  jogada_em_inicio?: string;
  jogada_em_fim?: string;
}

const qs = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [
    string,
    string,
  ][];
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
};

export interface PartidaPayload {
  id_jogo?: number;
  nivel?: number;
  jogada_em?: string;
}

export const matchesApi = {
  listar: (filtros: PartidaFiltros = {}) =>
    http.get<Partida[]>(`/partida/listar${qs(filtros as Record<string, string | undefined>)}`),
  obter: (id: number | string) => http.get<Partida>(`/partida/listar/${id}`),
  criar: (payload: { id_jogo: number; nivel: number; jogada_em: string }) =>
    http.post<Partida>('/partida/registrar', payload),
  atualizar: (id: number | string, payload: PartidaPayload) =>
    http.put(`/partida/atualizar/${id}`, payload),
  remover: (id: number | string) => http.del(`/partida/remover/${id}`),

  ranking: (id: number | string) => http.get<Participante[]>(`/partida/${id}/ranking`),
  participantes: (id: number | string) =>
    http.get<Participante[]>(`/partida/${id}/jogadores`),

  adicionarParticipante: (id_partida: number | string, id_jogador: number, posicao_final?: number) =>
    http.post<Participante>(`/partida/${id_partida}/jogador/${id_jogador}`, { posicao_final }),
  atualizarParticipante: (
    id_partida: number | string,
    id_jogador: number,
    payload: { posicao_final?: number; estatisticas?: Record<string, unknown>; vencedor?: boolean }
  ) => http.put(`/partida/${id_partida}/jogador/${id_jogador}`, payload),
  removerParticipante: (id_partida: number | string, id_jogador: number) =>
    http.del(`/partida/${id_partida}/jogador/${id_jogador}`),
};
