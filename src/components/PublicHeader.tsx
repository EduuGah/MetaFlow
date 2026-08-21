import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark, { Wordmark } from './BrandMark';

/**
 * Cabeçalho das páginas abertas. Um destino só, e ele muda conforme a sessão.
 *
 * O botão é renderizado de cara com o rótulo de visitante em vez de esperar a
 * verificação da sessão: prender o único CTA da página atrás de uma requisição
 * assíncrona é pior do que trocar o texto dele um instante depois.
 */
export default function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b border-edge">
      <div className="shell h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="MetaFlow — início">
          <BrandMark size={24} />
          <Wordmark className="text-base" />
        </Link>

        <Link to={user ? '/dashboard' : '/login'} className="btn btn-secondary">
          {user ? 'Abrir o painel' : 'Entrar'}
        </Link>
      </div>
    </header>
  );
}
