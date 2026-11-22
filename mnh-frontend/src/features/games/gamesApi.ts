import { http } from '@/shared/api/httpClient';
import type { CampoConfig } from '@/shared/ui/DynamicFields';

export interface Jogo {
  id: number;
  nome: string;
  descricao?: string | null;
  config_campos: CampoConfig[];
  ativo: boolean;
  total_partidas?: number;
}

export interface JogoPayload {
  nome: string;
  descricao?: string;
  config_campos: CampoConfig[];
}

export const gamesApi = {
  listar: (ativo?: boolean) => {
    const query = ativo === undefined ? '' : `?ativo=${ativo}`;
    return http.get<Jogo[]>(`/jogo/listar${query}`);
  },
  obter: (id: number | string) => http.get<Jogo>(`/jogo/listar/${id}`),
  registrar: (payload: JogoPayload) => http.post<Jogo>('/jogo/registrar', payload),
  atualizar: (id: number | string, payload: Partial<JogoPayload>) =>
    http.put(`/jogo/atualizar/${id}`, payload),
  desativar: (id: number | string) => http.put(`/jogo/desativar/${id}`),
  reativar: (id: number | string) => http.put(`/jogo/reativar/${id}`),
};
