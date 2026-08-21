import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BrandMark, { Wordmark } from './BrandMark';
import { IconExit } from './Icon';

/**
 * Cabeçalho das telas autenticadas.
 *
 * Fica colado no topo porque a marca também é o caminho de volta ao painel —
 * em telas longas de projeto isso evita depender do botão do navegador.
 * O nome da conta some abaixo de 640px: no celular o espaço vale mais para o
 * título da página do que para repetir quem está logado.
 */
export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const name = user?.user_metadata?.full_name || user?.email || null;

  const handleSignOut = async () => {
    setLeaving(true);
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-edge"
      style={{ background: 'color-mix(in srgb, var(--c-ink) 88%, transparent)', backdropFilter: 'blur(8px)' }}
    >
      <div className="shell h-14 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 rounded-md" aria-label="MetaFlow — ir para o painel">
          <BrandMark size={22} />
          <Wordmark className="text-[15px]" />
        </Link>

        {user && (
          <div className="flex items-center gap-1 min-w-0">
            <span className="hidden sm:block text-sm text-fg-muted truncate max-w-[16rem]" title={name ?? undefined}>
              {name}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              data-busy={leaving || undefined}
              className="btn btn-quiet btn-sm ml-1"
            >
              <IconExit size={15} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
