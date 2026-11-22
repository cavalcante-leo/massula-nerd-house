import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { useLogin } from './useLogin';
import { ApiError } from '@/shared/api/httpClient';

const schema = z.object({
  nome: z.string().min(1, 'Informe seu usuário.'),
  senha: z.string().min(1, 'Informe sua senha.'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (token) return <Navigate to="/" replace />;

  const onSubmit = (data: FormData) => {
    setServerError(null);
    login.mutate(data, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (err) => {
        if (err instanceof ApiError) setServerError(err.message);
        else setServerError('Não foi possível entrar. Tente novamente.');
      },
    });
  };

  return (
    <div className="login-screen">
      <div className="card card-hero login-card">
        <div className="login-brand">
          <div className="login-title">
            Massula
            <br />
            <span>Nerd House</span>
          </div>
        </div>
        <div className="login-sub">Painel de gestão de partidas</div>

        {serverError && <div className="banner error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label>Nome</label>
            <input placeholder="seu.nome" autoComplete="username" {...register('nome')} />
            {errors.nome && <span className="error">{errors.nome.message}</span>}
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('senha')}
            />
            {errors.senha && <span className="error">{errors.senha.message}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={login.isPending}>
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
