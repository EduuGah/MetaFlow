import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { isSupabaseConfigured } from './lib/env';
import Home from './pages/Home';

/**
 * Divisão de código por rota. `Home` entra no pacote principal de propósito:
 * é a página pública, a que os buscadores leem e a que precisa pintar rápido
 * numa primeira visita. As telas autenticadas — que só existem depois de um
 * login — chegam sob demanda, junto com o cliente do Supabase.
 */
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

/** Navegar entre rotas leva ao topo — sem isto o usuário abre um projeto no meio. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/** Enquanto um pedaço da aplicação chega. Sem giro no vazio: só uma barra fina. */
function RouteFallback() {
  return (
    <div className="min-h-dvh" aria-busy="true">
      <div className="h-0.5 w-full overflow-hidden bg-edge">
        <div className="h-full w-1/3 bg-signal" style={{ animation: 'route-slide 1.1s ease-in-out infinite' }} />
      </div>
      <span className="sr-only" role="status">
        Carregando…
      </span>
    </div>
  );
}

/**
 * Sem as variáveis do Supabase o app não tem o que mostrar. Antes isso lançava
 * uma exceção dentro do carregamento sob demanda e o resultado era uma página
 * branca. Agora a causa aparece escrita.
 */
function ConfigNotice() {
  return (
    <div className="min-h-dvh grid place-items-center px-5">
      <div className="panel max-w-narrow w-full p-8">
        <p className="eyebrow">Configuração incompleta</p>
        <h1 className="text-2xl mt-3">Faltam as credenciais do Supabase</h1>
        <p className="text-sm text-fg-muted mt-3">
          Crie um arquivo <code className="font-mono text-fg">.env.local</code> na raiz do projeto com as duas
          variáveis abaixo e reinicie o servidor de desenvolvimento. Em produção, defina-as no painel do provedor
          de hospedagem.
        </p>
        <pre className="mt-5 panel p-4 text-xs font-mono overflow-x-auto text-fg-muted" style={{ background: 'var(--c-raised)' }}>
{`VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anon>`}
        </pre>
        <p className="text-xs text-fg-soft mt-4">
          Use somente a chave <span className="font-mono">anon</span>. A chave{' '}
          <span className="font-mono">service_role</span> ignora as políticas de segurança e nunca deve chegar ao
          navegador.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigNotice />;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/termos" element={<Terms />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/:id"
                  element={
                    <ProtectedRoute>
                      <ProjectDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Caminhos antigos continuam funcionando. */}
                <Route path="/entrar" element={<Navigate to="/login" replace />} />
                <Route path="/painel" element={<Navigate to="/dashboard" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
