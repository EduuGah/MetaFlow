import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Gera o sitemap no build, a partir de VITE_SITE_URL.
 *
 * Um sitemap exige URLs absolutas. Como o domínio de produção não está no
 * repositório, ele não é inventado aqui: sem a variável definida, o arquivo
 * simplesmente não é emitido — melhor não ter sitemap do que ter um apontando
 * para um endereço errado.
 */
function sitemap(): Plugin {
  const ROUTES = [
    { path: '/', priority: '1.0', changefreq: 'monthly' },
    { path: '/privacidade', priority: '0.3', changefreq: 'yearly' },
    { path: '/termos', priority: '0.3', changefreq: 'yearly' },
  ];

  return {
    name: 'metaflow-sitemap',
    apply: 'build',
    generateBundle() {
      const configured = (process.env.VITE_SITE_URL ?? '').trim();
      if (!configured) {
        this.warn('VITE_SITE_URL não definida — sitemap.xml não foi gerado.');
        return;
      }
      if (!/^https?:\/\//i.test(configured)) {
        this.warn(
          `VITE_SITE_URL="${configured}" não é uma URL absoluta (falta http:// ou https://) — ` +
            'sitemap.xml não foi gerado.'
        );
        return;
      }
      const origin = configured.replace(/\/$/, '');

      const today = new Date().toISOString().slice(0, 10);
      const body = ROUTES.map(
        (r) =>
          `  <url>\n    <loc>${origin}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
      ).join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    sitemap(),
    VitePWA({
      registerType: 'autoUpdate',
      // og.png e robots.txt existem para rastreadores, não para o app:
      // pré-carregá-los no Service Worker só gastaria banda do usuário.
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MetaFlow — metas e tarefas',
        short_name: 'MetaFlow',
        description: 'Projetos pessoais em tarefas e subtarefas, com prazos, prioridades e progresso calculado.',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#080b13',
        background_color: '#080b13',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        // O aplicativo instalado abre direto no painel: quem já instalou não
        // precisa passar pela página de apresentação toda vez.
        start_url: '/dashboard',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Só o subconjunto latino é usado por um app em português; guardar
        // vietnamita e latin-ext no cache seria peso morto.
        // `favicon.svg` e `icons.svg` são restos do template inicial do Vite e
        // não são usados por nenhuma tela — podem ser apagados do repositório.
        globIgnores: ['**/*-vietnamese-*', '**/*-latin-ext-*', 'favicon.svg', 'icons.svg'],
        // Navegação sempre cai no index.html, menos nos arquivos de API e nos
        // estáticos que não fazem parte da casca do aplicativo.
        navigateFallbackDenylist: [/^\/api/, /\.(?:png|xml|txt)$/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],

  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // O aviso padrão de 500 kB não ajuda aqui: o maior pedaço é o cliente do
    // Supabase, que já vem separado e só é baixado nas telas autenticadas.
    chunkSizeWarningLimit: 600,
  },
});
