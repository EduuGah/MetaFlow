import { useEffect } from 'react';

/**
 * Metadados por rota sem framework de SSR.
 *
 * O app é uma SPA: existe um único index.html, então título, descrição,
 * canônica e Open Graph precisam ser reescritos na navegação. As tags do
 * index.html seguem sendo a versão servida a quem não executa JavaScript.
 */

const SITE_NAME = 'MetaFlow';

/**
 * Domínio de produção. Vem de VITE_SITE_URL (defina no provedor de
 * hospedagem); sem ela, a canônica cai na origem atual — que é o certo em
 * desenvolvimento e em preview.
 *
 * O valor só é aceito se for uma URL absoluta. `localhost:5173` sem esquema
 * geraria uma canônica inválida e silenciosa; nesse caso ignoramos e caímos
 * no comportamento local, que é o correto de qualquer forma.
 */
function siteOrigin(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export interface SeoInput {
  /** Sem o sufixo da marca — ele é adicionado aqui. */
  title: string;
  description: string;
  /** Caminho absoluto da rota, ex.: '/dashboard'. */
  path: string;
  /** Telas autenticadas e efêmeras não devem ser indexadas. */
  noindex?: boolean;
}

export function useSeo({ title, description, path, noindex = false }: SeoInput) {
  useEffect(() => {
    const fullTitle = path === '/' ? `${SITE_NAME} — ${title}` : `${title} · ${SITE_NAME}`;
    const url = `${siteOrigin()}${path}`;

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    );
    upsertLink('canonical', url);

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  }, [title, description, path, noindex]);
}
