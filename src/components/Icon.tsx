import type { SVGProps } from 'react';

/**
 * Conjunto de ícones do MetaFlow.
 *
 * Desenhados aqui, não importados de uma biblioteca: são nove formas, todas
 * construídas na mesma grade de 24px com traço de 1.6 e junções arredondadas.
 * Uma biblioteca inteira para nove ícones custaria mais bytes do que o app.
 *
 * Regra de uso: ícone só entra quando a ação é repetida e o rótulo em texto
 * não cabe (ações por linha, fechar, alternar). Ação principal sempre tem texto.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5 9.2 17.5 20 6.5" />
  </Svg>
);

/* Concluído: o mesmo arco do mostrador, fechado. */
export const IconDone = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.4 12.2l2.6 2.6 4.8-5.2" />
  </Svg>
);

/* Atenção — losango, não triângulo: distingue do aviso de erro do sistema. */
export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2 20.8 12 12 20.8 3.2 12z" />
    <path d="M12 8.4v4.2" />
    <path d="M12 15.9h.01" strokeWidth={2.2} />
  </Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11.2v4.6" />
    <path d="M12 8.3h.01" strokeWidth={2.2} />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconEdit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0-3-3L5.2 17z" />
    <path d="M14.5 7.5 16.5 9.5" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 6.5h15" />
    <path d="M9.5 6.5V4.8h5v1.7" />
    <path d="M6.6 6.5 7.5 19a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l.9-12.5" />
    <path d="M10.6 10v6M13.4 10v6" />
  </Svg>
);

export const IconChevron = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 5.5 15 12l-6.5 6.5" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="M15.4 15.4 20 20" />
  </Svg>
);

/* Prazo: bandeira de marcação, não calendário — o app marca uma data-alvo,
   não organiza um calendário. */
export const IconDeadline = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21V4" />
    <path d="M6 4.5h11.4l-2.3 4 2.3 4H6z" />
  </Svg>
);

export const IconList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <path d="M4.6 6.5h.01M4.6 12h.01M4.6 17.5h.01" strokeWidth={2.2} />
  </Svg>
);

export const IconBoard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.8" y="4.5" width="5" height="15" rx="1.2" />
    <rect x="10.5" y="4.5" width="5" height="10" rx="1.2" />
    <rect x="17.2" y="4.5" width="3" height="7" rx="1.2" />
  </Svg>
);

export const IconRepeat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 11.2a7.5 7.5 0 0 1 12.6-4.6l2.4 2.2" />
    <path d="M19.5 4.6v4.4h-4.3" />
    <path d="M19.5 12.8a7.5 7.5 0 0 1-12.6 4.6l-2.4-2.2" />
    <path d="M4.5 19.4V15h4.3" />
  </Svg>
);

export const IconExit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4.5h3.2a1.8 1.8 0 0 1 1.8 1.8v11.4a1.8 1.8 0 0 1-1.8 1.8h-3.2" />
    <path d="M10 8.2 13.8 12 10 15.8" />
    <path d="M13.5 12H4.5" />
  </Svg>
);
