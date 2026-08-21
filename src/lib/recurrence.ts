export const RECURRENCE_MINUTES: Record<string, number> = {
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '6h': 360,
  '12h': 720,
  daily: 1440,
  weekly: 10_080,
};

export const RECURRENCE_LABELS: Record<string, string> = {
  '15m': 'a cada 15 min',
  '30m': 'a cada 30 min',
  '1h': 'a cada hora',
  '6h': 'a cada 6 h',
  '12h': 'a cada 12 h',
  daily: 'diária',
  weekly: 'semanal',
};

export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Não repete' },
  { value: '15m', label: 'A cada 15 minutos' },
  { value: '30m', label: 'A cada 30 minutos' },
  { value: '1h', label: 'A cada hora' },
  { value: '6h', label: 'A cada 6 horas' },
  { value: '12h', label: 'A cada 12 horas' },
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly', label: 'Toda semana' },
] as const;

interface RecurrentLike {
  id: string;
  is_completed: boolean;
  recurrence?: string | null;
  last_completed_at?: string | null;
}

/**
 * Quais tarefas recorrentes já cumpriram o intervalo e devem voltar a "a fazer".
 * Regra de negócio preservada da versão anterior; extraída para poder ser
 * testada sem subir o React nem o Supabase.
 */
export function findTasksDueForReset<T extends RecurrentLike>(tasks: T[], now = new Date()): string[] {
  const due: string[] = [];

  for (const task of tasks) {
    if (!task.is_completed) continue;
    if (!task.recurrence || task.recurrence === 'none') continue;
    if (!task.last_completed_at) continue;

    const interval = RECURRENCE_MINUTES[task.recurrence];
    if (!interval) continue;

    const completedAt = new Date(task.last_completed_at).getTime();
    if (Number.isNaN(completedAt)) continue;

    const elapsedMinutes = (now.getTime() - completedAt) / 60_000;
    if (elapsedMinutes >= interval) due.push(task.id);
  }

  return due;
}
