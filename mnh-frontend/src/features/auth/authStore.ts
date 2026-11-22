import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UsuarioTipo = 'admin' | 'superadmin';

export interface Usuario {
  id: number;
  nome: string;
  nome_usuario: string;
  tipo: UsuarioTipo;
}

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  setAuth: (token: string, usuario: Usuario) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      setAuth: (token, usuario) => set({ token, usuario }),
      logout: () => set({ token: null, usuario: null }),
    }),
    { name: 'mnh.auth' }
  )
);

export const isSuperAdmin = () => useAuthStore.getState().usuario?.tipo === 'superadmin';
