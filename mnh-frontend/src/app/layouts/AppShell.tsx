import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Dice5,
  LayoutDashboard,
  Plus,
  Swords,
  User,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { dataLonga, iniciais } from '@/shared/lib/format';

const TITLES: Array<{ prefix: string; title: string; sub: string }> = [
  { prefix: '/jogadores', title: 'Jogadores', sub: 'Todos os membros cadastrados no clube' },
  { prefix: '/jogos', title: 'Jogos', sub: 'Catálogo de jogos disponíveis para as mesas' },
  { prefix: '/partidas', title: 'Partidas', sub: 'Histórico e registro de partidas jogadas' },
  { prefix: '/presencas', title: 'Presenças', sub: 'Frequência dos jogadores nos encontros' },
  { prefix: '/perfil', title: 'Meu perfil', sub: 'Seus dados de acesso' },
];

const NAV = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/jogadores', label: 'Jogadores', icon: Users },
  { to: '/jogos', label: 'Jogos', icon: Dice5 },
  { to: '/partidas', label: 'Partidas', icon: Swords },
  { to: '/presencas', label: 'Presenças', icon: CalendarCheck },
];

export function AppShell() {
  const { usuario } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle('role-admin', usuario?.tipo === 'admin');
  }, [usuario?.tipo]);

  const current =
    TITLES.find((t) => location.pathname.startsWith(t.prefix)) ??
    (location.pathname === '/'
      ? { title: `Olá, ${usuario?.nome ?? ''}`, sub: 'Aqui está o resumo do clube' }
      : { title: 'Massula Nerd House', sub: '' });

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-text">
            <div className="t1">Massula</div>
            <div className="t2">NERD HOUSE</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-bottom">
          <NavLink
            to="/perfil"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <User />
            <span>Meu perfil</span>
          </NavLink>
          <div className="nav-user-card">
            <div className="avatar">{iniciais(usuario?.nome ?? '?')}</div>
            <div>
              <div className="nav-user-name">{usuario?.nome}</div>
              <div className="nav-user-role">
                {usuario?.tipo === 'superadmin' ? 'Superadmin' : 'Admin'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{current.title}</h1>
            <div className="sub">{current.sub}</div>
          </div>
          <div className="topbar-right">
            <div className="date-chip">{dataLonga()}</div>
            <button className="btn btn-primary" onClick={() => navigate('/partidas/nova')}>
              <Plus size={15} /> Nova partida
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <button className="fab" onClick={() => navigate('/partidas/nova')} aria-label="Nova partida">
        <Plus size={24} />
      </button>

      <nav className="mobile-tabbar">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
