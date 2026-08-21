import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from './AppHeader';
import { ProjectRowSkeleton, StatsSkeleton } from './Skeleton';

/**
 * Este componente existia no projeto mas nunca havia sido ligado ao roteador:
 * `/dashboard` e `/dashboard/:id` abriam para qualquer visitante. Os dados
 * seguiam protegidos pelo RLS do Postgres, então nada vazava — mas quem não
 * estava autenticado via um painel vazio, sem nenhuma pista de que precisava
 * entrar. Agora as rotas privadas passam por aqui.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Esqueleto com a forma do painel, não um giro no vazio: a tela já
    // "chega" no lugar certo e nada salta quando os dados aparecem.
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <main className="shell py-6 sm:py-8">
          <div className="panel overflow-hidden divide-y divide-edge">
            <StatsSkeleton />
          </div>
          <div className="panel overflow-hidden divide-y divide-edge mt-4">
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
            <ProjectRowSkeleton />
          </div>
          <span className="sr-only" role="status">
            Verificando sua sessão…
          </span>
        </main>
      </div>
    );
  }

  // `state.from` devolve o usuário exatamente à página que ele tentou abrir —
  // um link direto para um projeto sobrevive ao login.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <>{children}</>;
}
