import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/app/layouts/AppShell';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PlayersPage } from '@/features/players/PlayersPage';
import { PlayerDetailPage } from '@/features/players/PlayerDetailPage';
import { PlayerFormPage } from '@/features/players/PlayerFormPage';
import { GamesPage } from '@/features/games/GamesPage';
import { GameDetailPage } from '@/features/games/GameDetailPage';
import { GameFormPage } from '@/features/games/GameFormPage';
import { LevelFormPage } from '@/features/games/LevelFormPage';
import { MatchesPage } from '@/features/matches/MatchesPage';
import { MatchDetailPage } from '@/features/matches/MatchDetailPage';
import { MatchNewPage } from '@/features/matches/MatchNewPage';
import { MatchEditPage } from '@/features/matches/MatchEditPage';
import { ParticipantFormPage } from '@/features/matches/ParticipantFormPage';
import { AttendancePage } from '@/features/attendance/AttendancePage';
import { AttendanceFormPage } from '@/features/attendance/AttendanceFormPage';
import { ProfilePage } from '@/features/profile/ProfilePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },

      { path: 'jogadores', element: <PlayersPage /> },
      { path: 'jogadores/novo', element: <PlayerFormPage /> },
      { path: 'jogadores/:id', element: <PlayerDetailPage /> },
      { path: 'jogadores/:id/editar', element: <PlayerFormPage /> },

      { path: 'jogos', element: <GamesPage /> },
      { path: 'jogos/novo', element: <GameFormPage /> },
      { path: 'jogos/:id', element: <GameDetailPage /> },
      { path: 'jogos/:id/editar', element: <GameFormPage /> },
      { path: 'jogos/:id/niveis/novo', element: <LevelFormPage /> },
      { path: 'jogos/:id/niveis/:nivelId/editar', element: <LevelFormPage /> },

      { path: 'partidas', element: <MatchesPage /> },
      { path: 'partidas/nova', element: <MatchNewPage /> },
      { path: 'partidas/:id', element: <MatchDetailPage /> },
      { path: 'partidas/:id/editar', element: <MatchEditPage /> },
      { path: 'partidas/:id/jogadores/novo', element: <ParticipantFormPage /> },
      { path: 'partidas/:id/jogadores/:jogadorId/editar', element: <ParticipantFormPage /> },

      { path: 'presencas', element: <AttendancePage /> },
      { path: 'presencas/nova', element: <AttendanceFormPage /> },

      { path: 'perfil', element: <ProfilePage /> },
    ],
  },
]);
