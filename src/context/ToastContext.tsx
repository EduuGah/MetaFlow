import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { IconAlert, IconClose, IconDone, IconInfo } from '../components/Icon';

export type ToastType = 'success' | 'error' | 'info';

/** Uma ação de resgate no próprio aviso — hoje só "Desfazer". */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  leaving?: boolean;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextData | null>(null);

const DURATION: Record<ToastType, number> = {
  success: 2800,
  info: 3400,
  // Erro fica mais tempo: é a única mensagem que exige uma decisão do usuário.
  error: 6000,
};

/**
 * Aviso com ação vive mais do que o resto: ele não informa, ele oferece uma
 * saída. Oito segundos é o tempo de ler "excluída", perceber que foi a linha
 * errada e alcançar o botão — bem abaixo disso o desfazer vira decoração.
 */
const ACTION_DURATION = 8000;

const EXIT_MS = 180;

/**
 * Avisos do app.
 *
 * Três mudanças em relação à versão anterior, todas por causa de uso real:
 * · mensagens idênticas em sequência viram uma só — marcar dez subtarefas não
 *   deve empilhar dez avisos iguais na tela;
 * · a região tem `role="status"` e `aria-live`, então o leitor de tela anuncia
 *   o resultado da ação (antes, nada era anunciado);
 * · a contagem para desaparecer pausa com o ponteiro ou o foco em cima —
 *   ninguém perde uma mensagem de erro porque estava lendo devagar.
 *
 * A animação é CSS. A biblioteca de animação que existia aqui saiu do projeto.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());
  const paused = useRef(false);

  const dismiss = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const schedule = useCallback(
    (id: string, ms: number) => {
      timers.current.set(id, window.setTimeout(() => dismiss(id), ms));
    },
    [dismiss]
  );

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', action?: ToastAction) => {
      const life = action ? ACTION_DURATION : DURATION[type];

      setToasts((prev) => {
        // Avisos com ação nunca se fundem: cada exclusão tem o seu próprio
        // desfazer, e juntar dois deixaria uma tarefa sem volta.
        const twin = action
          ? undefined
          : prev.find((t) => t.message === message && t.type === type && !t.action && !t.leaving);

        if (twin) {
          window.clearTimeout(timers.current.get(twin.id));
          if (!paused.current) schedule(twin.id, life);
          return prev;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!paused.current) schedule(id, life);
        // No máximo três de cada vez: além disso vira parede de texto.
        return [...prev, { id, message, type, action }].slice(-3);
      });
    },
    [schedule]
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  const hold = () => {
    paused.current = true;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current.clear();
  };

  const release = () => {
    paused.current = false;
    setToasts((current) => {
      current.forEach((t) => {
        if (!t.leaving && !timers.current.has(t.id)) {
          schedule(t.id, t.action ? ACTION_DURATION : DURATION[t.type]);
        }
      });
      return current;
    });
  };

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        onMouseEnter={hold}
        onMouseLeave={release}
        onFocusCapture={hold}
        onBlurCapture={release}
        className="fixed z-[60] flex flex-col gap-2 pointer-events-none
                   inset-x-3 top-3 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:w-[22rem]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {toasts.map((toast) => (
          <ToastRow key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const tone =
    toast.type === 'success' ? 'text-flow' : toast.type === 'error' ? 'text-alert' : 'text-fg-muted';

  const Glyph = toast.type === 'success' ? IconDone : toast.type === 'error' ? IconAlert : IconInfo;

  return (
    <div
      className="panel pointer-events-auto flex items-start gap-3 py-3 pl-3.5 pr-2 shadow-overlay"
      style={{
        background: 'var(--c-raised)',
        animation: toast.leaving
          ? `toast-out ${EXIT_MS}ms ease-in forwards`
          : 'rise 200ms cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <span className={`${tone} mt-0.5 shrink-0`}>
        <Glyph size={17} />
      </span>
      <p className="text-sm flex-1 min-w-0">{toast.message}</p>

      {/* A ação fica antes do X, na ordem de leitura e de tabulação: quem
          chega aqui pelo teclado alcança "Desfazer" antes de dispensar. */}
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="btn btn-secondary btn-sm shrink-0 text-signal"
        >
          {toast.action.label}
        </button>
      )}

      <button type="button" onClick={onDismiss} className="btn-icon h-7 w-7 shrink-0" aria-label="Dispensar aviso">
        <IconClose size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider');
  return context;
}
