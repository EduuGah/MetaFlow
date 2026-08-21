import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './Icon';
import { cn } from '../lib/utils';

/**
 * Diálogo do MetaFlow.
 *
 * Substitui as quatro sobreposições que existiam soltas (cada uma com o seu
 * próprio `fixed inset-0`) e que não tinham nada disto: foco preso dentro do
 * diálogo, Esc para fechar, clique no fundo, trava de rolagem, devolução do
 * foco ao elemento que abriu, `role`/`aria-modal` e rótulo acessível.
 *
 * No celular ele sobe como folha inferior — o polegar alcança as ações sem
 * esticar até o meio da tela. No desktop, diálogo centralizado.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Frase curta abaixo do título, quando a ação precisa de contexto. */
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    openCount += 1;
    document.body.setAttribute('data-overlay', 'open');
    document.addEventListener('keydown', handleKeyDown, true);

    // O primeiro campo recebe o foco; se não houver, o próprio painel.
    const target =
      panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current;
    target?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) document.body.removeAttribute('data-overlay');
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-veil"
      style={{ background: 'rgba(4, 6, 12, 0.72)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'panel w-full animate-sheet-in shadow-overlay outline-none',
          'rounded-b-none sm:rounded-b-xl max-h-[92dvh] overflow-y-auto',
          // `lg` existe para o diálogo de importação: um campo de colar
          // documento e a prévia da árvore ao lado não cabem em 28rem.
          size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Puxador: sinaliza folha arrastável no celular, some no desktop. */}
        <div className="sm:hidden flex justify-center pt-3">
          <span className="h-1 w-9 rounded-full bg-edge-strong" />
        </div>

        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:pt-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-fg-muted mt-1.5">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-icon -mr-2 -mt-1 shrink-0" aria-label="Fechar">
            <IconClose size={18} />
          </button>
        </div>

        <div className="px-5 pb-5 sm:pb-6 pt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/** Rodapé padrão: ação secundária à esquerda, principal à direita. */
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-6">{children}</div>;
}
