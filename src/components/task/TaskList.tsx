import { useState } from 'react';
import type { Task } from '../../types';
import { computeProgress } from '../../lib/progress';
import { cn } from '../../lib/utils';
import { IconEdit, IconPlus, IconTrash } from '../Icon';
import { PriorityBadge, RecurrenceBadge } from './TaskBadges';

export interface TaskHandlers {
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (parentId: string, title: string) => Promise<boolean>;
}

interface TaskListProps extends TaskHandlers {
  tasks: Task[];
  subtasksOf: (id: string) => Task[];
}

/**
 * Visão em lista: uma linha por tarefa, subtarefas recuadas sob um fio.
 * Rolagem vertical simples — é o modo de trabalhar item a item.
 */
export default function TaskList({ tasks, subtasksOf, onToggle, onEdit, onDelete, onAddSubtask }: TaskListProps) {
  return (
    <ul className="divide-y divide-edge">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          subtasks={subtasksOf(task.id)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  subtasks,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
}: TaskHandlers & { task: Task; subtasks: Task[] }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const progress = computeProgress(subtasks);

  const submitSubtask = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title || busy) return;
    setBusy(true);
    const ok = await onAddSubtask(task.id, title);
    setBusy(false);
    if (ok) setDraft('');
  };

  return (
    <li className="px-4 sm:px-5 py-3.5">
      <div className="flex items-start gap-3">
        <label className="check-hit mt-px" aria-label={`Concluir ${task.title}`}>
          <input type="checkbox" checked={task.is_completed} onChange={() => onToggle(task)} className="check" />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'font-medium text-[0.9375rem]',
                task.is_completed ? 'line-through text-fg-soft' : 'text-fg'
              )}
            >
              {task.title}
            </span>
            <PriorityBadge priority={task.priority} />
            <RecurrenceBadge recurrence={task.recurrence} />
          </div>

          {subtasks.length > 0 && (
            <div className="flex items-center gap-2.5 mt-2 max-w-xs">
              <div
                className="h-1 flex-1 rounded-full overflow-hidden bg-raised"
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Etapas de ${task.title}`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progress.percent}%`, background: 'var(--c-flow)' }}
                />
              </div>
              <span className="text-2xs font-mono text-fg-soft shrink-0">
                {progress.done}/{progress.total} etapas
              </span>
            </div>
          )}
        </div>

        {/* No celular os alvos encolhem de 36 para 32px: três botões de 36
            comem quase um terço da largura da linha e espremem o título. */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            aria-expanded={composerOpen}
            title="Adicionar etapa"
            className="btn-icon h-8 w-8 sm:h-9 sm:w-9"
            aria-label={`Adicionar etapa em ${task.title}`}
          >
            <IconPlus size={16} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            title="Editar tarefa"
            className="btn-icon h-8 w-8 sm:h-9 sm:w-9"
            aria-label={`Editar ${task.title}`}
          >
            <IconEdit size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            title="Excluir tarefa"
            className="btn-icon h-8 w-8 sm:h-9 sm:w-9 hover:text-alert"
            aria-label={`Excluir ${task.title}`}
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      {composerOpen && (
        <form onSubmit={submitSubtask} className="flex gap-2 mt-3 ml-9">
          <input
            type="text"
            autoFocus
            value={draft}
            maxLength={160}
            placeholder="Nome da etapa"
            aria-label={`Nova etapa em ${task.title}`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setComposerOpen(false)}
            className="field flex-1"
          />
          <button type="submit" disabled={!draft.trim() || busy} data-busy={busy || undefined} className="btn btn-secondary">
            Adicionar
          </button>
        </form>
      )}

      {subtasks.length > 0 && (
        <ul className="mt-2.5 ml-[1.15rem] pl-4 border-l border-edge space-y-0.5">
          {subtasks.map((sub) => (
            <li key={sub.id} className="flex items-center gap-2.5 py-1 group">
              <label className="check-hit" aria-label={`Concluir etapa ${sub.title}`}>
                <input
                  type="checkbox"
                  checked={sub.is_completed}
                  onChange={() => onToggle(sub)}
                  className="check w-4 h-4"
                />
              </label>
              <span
                className={cn(
                  'text-sm flex-1 min-w-0',
                  sub.is_completed ? 'line-through text-fg-soft' : 'text-fg-muted'
                )}
              >
                {sub.title}
              </span>
              <span className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onEdit(sub)}
                  className="btn-icon h-8 w-8"
                  aria-label={`Editar etapa ${sub.title}`}
                >
                  <IconEdit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(sub)}
                  className="btn-icon h-8 w-8 hover:text-alert"
                  aria-label={`Excluir etapa ${sub.title}`}
                >
                  <IconTrash size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
