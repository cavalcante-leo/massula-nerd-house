import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { matchesApi, type PartidaFiltros } from './matchesApi';
import { useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';

export function useMatches(filtros: PartidaFiltros = {}) {
  return useQuery({
    queryKey: ['matches', filtros],
    queryFn: () => matchesApi.listar(filtros),
  });
}

export function useMatch(id: number | string | undefined) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.obter(id as string),
    enabled: id !== undefined,
  });
}

export function useParticipantes(id: number | string | undefined) {
  return useQuery({
    queryKey: ['match-participants', id],
    queryFn: () => matchesApi.participantes(id as string),
    enabled: id !== undefined,
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number | string) => matchesApi.remover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      toast('Partida removida.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao remover.', 'error'),
  });
}

export function useRemoveParticipant(idPartida: number | string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (idJogador: number) => matchesApi.removerParticipante(idPartida as string, idJogador),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-participants', idPartida] });
      toast('Participante removido.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao remover.', 'error'),
  });
}
