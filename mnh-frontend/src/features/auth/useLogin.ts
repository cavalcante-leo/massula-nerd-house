import { useMutation } from '@tanstack/react-query';
import { http } from '@/shared/api/httpClient';
import { useAuthStore, type Usuario } from './authStore';

interface LoginPayload {
  nome: string;
  senha: string;
}

interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      http.post<LoginResponse>('/auth/login', payload),
    onSuccess: (data) => setAuth(data.accessToken, data.usuario),
  });
}
