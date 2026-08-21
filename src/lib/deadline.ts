export type DeadlineStatus = 'overdue' | 'today' | 'soon' | 'later' | 'none';

export interface DeadlineInfo {
  status: DeadlineStatus;
  /** Rótulo curto para chips e listas. */
  label: string;
  /** Token de cor semântica; `null` quando o prazo não pede atenção. */
  tone: 'alert' | 'signal' | 'flow' | null;
  /** Dias inteiros até o prazo. Negativo = atrasado. `null` sem prazo. */
  days: number | null;
}

/**
 * Classifica o prazo de um projeto.
 *
 * A data vem do Postgres como 'YYYY-MM-DD' (um dia de calendário, sem hora).
 * Ela é montada em horário local de propósito: `new Date('2026-03-10')` seria
 * interpretado como UTC e, a oeste de Greenwich, mostraria o dia anterior.
 */
export function getDeadlineInfo(deadline: string | null | undefined, now = new Date()): DeadlineInfo {
  if (!deadline) return { status: 'none', label: 'Sem prazo', tone: null, days: null };

  const parts = deadline.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return { status: 'none', label: 'Sem prazo', tone: null, days: null };
  }

  const [year, month, day] = parts;
  const target = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) {
    return {
      status: 'overdue',
      label: days === -1 ? 'Atrasado 1 dia' : `Atrasado ${Math.abs(days)} dias`,
      tone: 'alert',
      days,
    };
  }
  if (days === 0) return { status: 'today', label: 'Vence hoje', tone: 'signal', days };
  if (days === 1) return { status: 'soon', label: 'Vence amanhã', tone: 'signal', days };
  if (days <= 7) return { status: 'soon', label: `Faltam ${days} dias`, tone: 'flow', days };

  return { status: 'later', label: target.toLocaleDateString('pt-BR'), tone: null, days };
}

/** Data legível por extenso, para o cabeçalho do projeto. */
export function formatDeadlineLong(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  const [year, month, day] = deadline.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
