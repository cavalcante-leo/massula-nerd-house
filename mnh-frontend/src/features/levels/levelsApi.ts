import { http } from '@/shared/api/httpClient';

export interface NivelJogoCatalogo {
  id: number;
  id_jogo: number;
  nivel: number;
  modelo?: string | null;
  ativo: boolean;
  jogo?: { id: number; nome: string };
  jogadoresNivel?: Array<{ id: number; jogador: { id: number; nome: string } }>;
}

export interface NivelJogador {
  id: number;
  id_jogador: number;
  id_nivel_jogo: number;
  nivelJogo: {
    id: number;
    nivel: number;
    modelo?: string | null;
    jogo?: { id: number; nome: string };
  };
}

export interface NivelJogoPayload {
  id_jogo: number;
  nivel: number;
  modelo?: string;
}

export const levelsApi = {
  // Catálogo de níveis por jogo
  listarPorJogo: (id_jogo: number | string, ativo?: boolean) => {
    const query = ativo === undefined ? '' : `?ativo=${ativo}`;
    return http.get<NivelJogoCatalogo[]>(`/nivel-jogo/jogo/${id_jogo}${query}`);
  },
  criar: (payload: NivelJogoPayload) =>
    http.post<NivelJogoCatalogo>('/nivel-jogo/registrar', payload),
  atualizar: (id: number | string, payload: Partial<NivelJogoPayload> & { ativo?: boolean }) =>
    http.put(`/nivel-jogo/atualizar/${id}`, payload),
  desativar: (id: number | string) => http.put(`/nivel-jogo/desativar/${id}`),
  reativar: (id: number | string) => http.put(`/nivel-jogo/reativar/${id}`),

  // Níveis do jogador
  listarPorJogador: (id_jogador: number | string) =>
    http.get<NivelJogador[]>(`/jogador-nivel/jogador/${id_jogador}`),
  obterNivel: (id_jogador: number | string, id_jogo: number | string) =>
    http.get<NivelJogador>(`/jogador-nivel/jogador/${id_jogador}/jogo/${id_jogo}`),
  definir: (id_jogador: number | string, id_jogo: number | string, nivel: number) =>
    http.put(`/jogador-nivel/jogador/${id_jogador}/jogo/${id_jogo}`, { nivel }),
};
