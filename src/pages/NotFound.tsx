import { Link, useLocation } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { useSeo } from '../lib/seo';

/**
 * 404 do MetaFlow.
 *
 * Mantém cabeçalho e rodapé — quem cai aqui continua dentro do produto, não
 * numa página órfã. O mostrador vazio é o mesmo componente do painel: 0%,
 * porque não há nada para ler neste endereço. É a única piada visual do app,
 * e ela usa uma peça que já existe.
 */
export default function NotFound() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  useSeo({
    path: pathname,
    title: 'Página não encontrada',
    description: 'O endereço acessado não existe no MetaFlow.',
    noindex: true,
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="shell flex-1 grid place-items-center py-20">
        <div className="max-w-narrow w-full">
          <div className="flex items-center gap-5">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="9.4" stroke="var(--c-edge-strong)" strokeWidth="2.2" strokeDasharray="2 3.2" />
            </svg>
            <div>
              <p className="eyebrow">Erro 404</p>
              <h1 className="text-3xl sm:text-4xl mt-2">Não há nada neste endereço</h1>
            </div>
          </div>

          <p className="text-fg-muted mt-6 max-w-prose">
            O link pode estar incompleto, ou o projeto que estava aqui foi excluído. Nada foi perdido: tudo o que
            está na sua conta continua no painel.
          </p>

          <p className="text-sm font-mono text-fg-soft mt-4 break-all">{pathname}</p>

          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <Link to={user ? '/dashboard' : '/'} className="btn btn-primary btn-lg">
              {user ? 'Ir para o painel' : 'Voltar ao início'}
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-secondary btn-lg">
                Entrar na minha conta
              </Link>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
