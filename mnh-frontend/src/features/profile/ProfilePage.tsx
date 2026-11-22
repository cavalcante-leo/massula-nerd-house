import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { iniciais } from '@/shared/lib/format';

export function ProfilePage() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="card card-hero" style={{ maxWidth: 480, padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <div className="avatar big ac-gold">{iniciais(usuario?.nome ?? '?')}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
            {usuario?.nome}
          </div>
          <div className="tag">{usuario?.nome_usuario}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span className={`pill ${usuario?.tipo === 'superadmin' ? 'gold-solid' : 'felt'}`}>
          {usuario?.tipo === 'superadmin' ? 'Superadmin' : 'Admin'}
        </span>
        <span className="pill green">Ativo</span>
      </div>

      <button
        className="btn btn-ghost"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut size={15} /> Sair da conta
      </button>
    </div>
  );
}
