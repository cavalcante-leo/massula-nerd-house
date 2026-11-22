import { http } from '@/shared/api/httpClient';

export interface Jogador {
  id: number;
  nome: string;
  instagram?: string | null;
  telefone?: string | null;
  ativo: boolean;
  total_presencas?: number;
  patente?: number;
  patente_calculada?: number;
  criado_por?: number;
}

export interface JogadorPayload {
  nome: string;
  instagram?: string;
  telefone?: string;
}

const qs = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
};

export const playersApi = {
  listar: (ativo?: boolean) =>
    http.get<Jogador[]>(`/jogador/listar${qs({ ativo: ativo === undefined ? undefined : String(ativo) })}`),
  obter: (id: number | string) => http.get<Jogador>(`/jogador/listar/${id}`),
  registrar: (payload: JogadorPayload) => http.post<Jogador>('/jogador/registrar', payload),
  atualizar: (id: number | string, payload: Partial<JogadorPayload>) =>
    http.put(`/jogador/atualizar/${id}`, payload),
  desativar: (id: number | string) => http.put(`/jogador/desativar/${id}`),
  reativar: (id: number | string) => http.put(`/jogador/reativar/${id}`),
  registrarPresenca: (id: number | string, dataBR: string) =>
    http.post(`/jogador/registrarPresenca/${id}`, { data: dataBR }),
};
