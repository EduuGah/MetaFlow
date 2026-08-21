import type { Task } from '../../types';

export type BoardStatus = 'todo' | 'in_progress' | 'done';

export const BOARD_COLUMNS: { id: BoardStatus; label: string; tone: string }[] = [
  { id: 'todo', label: 'A fazer', tone: 'var(--c-fg-soft)' },
  { id: 'in_progress', label: 'Em andamento', tone: 'var(--c-signal)' },
  { id: 'done', label: 'Concluído', tone: 'var(--c-flow)' },
];

/**
 * Tarefas antigas foram criadas antes da coluna `status` existir e só têm
 * `is_completed`. Esta função é o único lugar que sabe disso.
 */
export function statusOf(task: Task): BoardStatus {
  return (task.status as BoardStatus) ?? (task.is_completed ? 'done' : 'todo');
}
