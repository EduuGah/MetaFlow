/** @type {import('tailwindcss').Config} */

// Fonte única de verdade do design system.
// Os mesmos valores são expostos como CSS custom properties em src/index.css,
// de modo que Tailwind, CSS puro e estilos inline nunca divergem.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  // As classes escritas à mão em src/index.css vivem em `@layer components`,
  // e o Tailwind remove do build qualquer regra dessa camada cujo nome ele não
  // encontre na varredura de conteúdo. Declará-las aqui garante que nenhuma
  // diferença de ambiente na leitura dos arquivos derrube o visual do produto.
  safelist: [
    'panel', 'panel-flush', 'hairline', 'eyebrow', 'shell', 'dock-safe', 'link',
    'btn', 'btn-lg', 'btn-sm', 'btn-primary', 'btn-secondary', 'btn-quiet', 'btn-danger', 'btn-icon',
    'field', 'field-label', 'check', 'check-hit', 'chip', 'chip-static', 'skeleton', 'focus-inset',
  ],
  theme: {
    extend: {
      colors: {
        // Superfícies — degraus de profundidade, não sombras.
        // `ink` é o fundo da página. O nome evita colidir com a escala
        // tipográfica: `base` geraria `.text-base` duas vezes, e a regra de
        // cor sobrescreveria a de tamanho.
        ink: 'var(--c-ink)',
        panel: 'var(--c-panel)',
        raised: 'var(--c-raised)',
        elevated: 'var(--c-elevated)',

        // Linhas. `edge` é decorativa; `edge-strong` é a borda de
        // componentes interativos e cumpre 3:1 (WCAG 1.4.11).
        edge: 'var(--c-edge)',
        'edge-strong': 'var(--c-edge-strong)',

        // Texto — todos os três passam 4.5:1 sobre qualquer superfície.
        fg: {
          DEFAULT: 'var(--c-fg)',
          muted: 'var(--c-fg-muted)',
          soft: 'var(--c-fg-soft)',
        },

        // Três acentos, significado fixo:
        // signal = ação e atenção · flow = progresso e conclusão · alert = risco
        signal: {
          DEFAULT: 'var(--c-signal)',
          ink: 'var(--c-signal-ink)',
          soft: 'var(--c-signal-soft)',
        },
        flow: {
          DEFAULT: 'var(--c-flow)',
          ink: 'var(--c-flow-ink)',
          soft: 'var(--c-flow-soft)',
        },
        alert: {
          DEFAULT: 'var(--c-alert)',
          ink: 'var(--c-alert-ink)',
          soft: 'var(--c-alert-soft)',
        },
      },

      fontFamily: {
        display: ['Archivo Variable', 'Archivo', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      fontSize: {
        // Escala tipográfica com line-height embutido — evita números soltos.
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.6rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.95rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.375rem', { lineHeight: '2.65rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '3.15rem', letterSpacing: '-0.03em' }],
      },

      borderRadius: {
        xs: '0.25rem',
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },

      maxWidth: {
        prose: '68ch',
        shell: '64rem',
        narrow: '44rem',
      },

      boxShadow: {
        // Sombra só existe onde algo realmente flutua sobre o conteúdo.
        overlay: '0 24px 60px -12px rgba(0, 0, 0, 0.7)',
        dock: '0 -8px 24px -12px rgba(0, 0, 0, 0.8)',
        none: 'none',
      },

      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.985)' },
          to: { opacity: '1', transform: 'none' },
        },
        veil: { from: { opacity: '0' }, to: { opacity: '1' } },
        sweep: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
      },

      animation: {
        rise: 'rise 260ms cubic-bezier(0.16,1,0.3,1) both',
        'sheet-in': 'sheet-in 220ms cubic-bezier(0.16,1,0.3,1) both',
        veil: 'veil 160ms ease-out both',
      },
    },
  },
  plugins: [],
};
