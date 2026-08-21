import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeo } from '../lib/seo';
import { reportError, userMessage } from '../lib/logger';
import BrandMark, { Wordmark } from '../components/BrandMark';
import { IconAlert } from '../components/Icon';

/** Marca do Google, usada conforme as diretrizes de identidade do provedor. */
function GoogleG() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    path: '/login',
    title: 'Entrar',
    description: 'Acesse o MetaFlow com a sua conta Google para ver seus projetos, tarefas e prazos.',
    noindex: true,
  });

  // Quem já tem sessão não deve ver esta tela: volta para onde tentou ir.
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  if (!loading && user) return <Navigate to={from || '/dashboard'} replace />;

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (authError) {
      // O texto cru do provedor não vai para a tela; ele fica no relatório.
      reportError('auth.signInWithOAuth', authError);
      setError(userMessage('Não foi possível abrir o login do Google. Tente de novo em instantes.', authError));
      setBusy(false);
    }
    // Em caso de sucesso o navegador sai desta página — manter `busy` evita
    // um segundo clique durante o redirecionamento.
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 grid place-items-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2.5 rounded-md">
            <BrandMark size={24} />
            <Wordmark className="text-base" />
          </Link>

          <h1 className="text-2xl mt-8">Entrar no painel</h1>
          <p className="text-sm text-fg-muted mt-2.5">
            Seus projetos ficam na sua conta Google. Nenhuma senha é criada nem guardada aqui.
          </p>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 mt-6 p-3.5 rounded-md border"
              style={{ background: 'var(--c-alert-soft)', borderColor: 'var(--c-alert)' }}
            >
              <span className="text-alert mt-0.5 shrink-0">
                <IconAlert size={16} />
              </span>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            data-busy={busy || undefined}
            className="btn btn-secondary btn-lg w-full mt-7"
          >
            <GoogleG />
            Continuar com o Google
          </button>

          <p className="text-xs text-fg-soft mt-6">
            Ao entrar você concorda com os{' '}
            <Link to="/termos" className="link">
              Termos de uso
            </Link>{' '}
            e com a{' '}
            <Link to="/privacidade" className="link">
              Política de Privacidade
            </Link>
            .
          </p>

          <Link to="/" className="inline-block text-sm text-fg-soft hover:text-fg mt-8">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
