import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import SiteFooter from './SiteFooter';

/**
 * Casca das páginas de texto longo (privacidade, termos).
 * Medida de linha limitada a ~68 caracteres e hierarquia em dois níveis —
 * documento para ser lido, não bloco de texto para ser rolado.
 */
export default function DocumentPage({
  eyebrow,
  title,
  updatedAt,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="shell flex-1 py-12 sm:py-16">
        <div className="max-w-prose">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl mt-3">{title}</h1>
          <p className="text-sm font-mono text-fg-soft mt-4">Última atualização: {updatedAt}</p>
          <p className="text-fg-muted mt-6">{intro}</p>

          <div className="mt-10 space-y-9">{children}</div>

          <Link to="/" className="inline-block text-sm text-fg-soft hover:text-fg mt-14">
            ← Voltar ao início
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="hairline pt-7">
      <h2 className="text-lg">{title}</h2>
      <div className="text-sm text-fg-muted mt-3 space-y-3">{children}</div>
    </section>
  );
}

/**
 * Marca um trecho que depende de informação que só o responsável pelo produto
 * tem (razão social, e-mail de contato, foro). Fica visível de propósito: um
 * documento legal com lacuna disfarçada é pior do que um com lacuna assumida.
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark
      className="px-1.5 py-0.5 rounded-xs font-mono text-xs"
      style={{ background: 'var(--c-signal-soft)', color: 'var(--c-signal)' }}
    >
      {children}
    </mark>
  );
}
