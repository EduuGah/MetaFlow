import { Link } from 'react-router-dom';
import BrandMark, { Wordmark } from './BrandMark';

const YEAR = new Date().getFullYear();

/**
 * Rodapé curto de propósito. Só entram links que levam a algum lugar real
 * deste projeto — nada de colunas de "recursos" e "empresa" inventadas para
 * encher a largura da tela.
 */
export default function SiteFooter() {
  return (
    <footer className="hairline mt-20">
      <div className="shell py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <BrandMark size={20} />
          <Wordmark className="text-sm" />
          <span className="text-sm text-fg-soft">· {YEAR}</span>
        </div>

        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg-muted">
            <li>
              <Link to="/dashboard" className="hover:text-fg">
                Painel
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-fg">
                Privacidade
              </Link>
            </li>
            <li>
              <Link to="/termos" className="hover:text-fg">
                Termos de uso
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/EduuGah/metaflow"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-fg"
              >
                Código-fonte
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
