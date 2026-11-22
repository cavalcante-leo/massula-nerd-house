import { http } from '@/shared/api/httpClient';

export interface Presenca {
  id: number;
  id_jogador: number;
  data_presenca: string;
  jogador?: { id: number; nome: string };
}

export const attendanceApi = {
  listar: (inicio?: string, fim?: string) => {
    const params = new URLSearchParams();
    if (inicio) params.set('inicio', inicio);
    if (fim) params.set('fim', fim);
    const query = params.toString() ? `?${params.toString()}` : '';
    return http.get<Presenca[]>(`/presenca/listar${query}`);
  },
  registrar: (idJogador: number | string, dataBR: string) =>
    http.post(`/presenca/registrar/${idJogador}`, { data: dataBR }),
};
