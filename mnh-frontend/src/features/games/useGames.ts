import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gamesApi, type JogoPayload } from './gamesApi';
import { useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';

export function useGames(ativo?: boolean) {
  return useQuery({
    queryKey: ['games', ativo ?? 'all'],
    queryFn: () => gamesApi.listar(ativo),
  });
}

export function useGame(id: number | string | undefined) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => gamesApi.obter(id as string),
    enabled: id !== undefined,
  });
}

export function useSaveGame() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number | string; payload: JogoPayload }) =>
      id ? gamesApi.atualizar(id, payload) : gamesApi.registrar(payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['game', vars.id] });
      toast(vars.id ? 'Jogo atualizado.' : 'Jogo cadastrado com sucesso.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao salvar jogo.', 'error'),
  });
}

export function useToggleGame() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, ativo }: { id: number | string; ativo: boolean }) =>
      ativo ? gamesApi.desativar(id) : gamesApi.reativar(id),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['games'] });
      toast(vars.ativo ? 'Jogo desativado.' : 'Jogo reativado.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro na operação.', 'error'),
  });
}
