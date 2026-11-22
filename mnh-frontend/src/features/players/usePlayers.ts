import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playersApi, type JogadorPayload } from './playersApi';
import { useToast } from '@/shared/ui';
import { ApiError } from '@/shared/api/httpClient';
import { hojeBR } from '@/shared/lib/format';

export function usePlayers(ativo?: boolean) {
  return useQuery({
    queryKey: ['players', ativo ?? 'all'],
    queryFn: () => playersApi.listar(ativo),
  });
}

export function usePlayer(id: number | string | undefined) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => playersApi.obter(id as string),
    enabled: id !== undefined,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (payload: JogadorPayload) => playersApi.registrar(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast('Jogador cadastrado com sucesso.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao salvar jogador.', 'error'),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<JogadorPayload> }) =>
      playersApi.atualizar(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast('Jogador atualizado.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao atualizar.', 'error'),
  });
}

export function useTogglePlayer() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, ativo }: { id: number | string; ativo: boolean }) =>
      ativo ? playersApi.desativar(id) : playersApi.reativar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast(vars.ativo ? 'Jogador desativado.' : 'Jogador reativado.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro na operação.', 'error'),
  });
}

export function useQuickPresence() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number | string) => playersApi.registrarPresenca(id, hojeBR()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
      toast('Presença de hoje registrada.');
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : 'Erro ao registrar presença.', 'error'),
  });
}
