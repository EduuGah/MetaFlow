import { useState } from 'react';
import type { Task } from '../../types';
import { computeProgress } from '../../lib/progress';
import { IconEdit, IconTrash } from '../Icon';
import { PriorityBadge, RecurrenceBadge } from './TaskBadges';
import { BOARD_COLUMNS, statusOf, type BoardStatus } from './board';

interface TaskBoardProps {
  tasks: Task[];
  subtasksOf: (id: string) => Task[];
  onMove: (task: Task, status: BoardStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggle: (task: Task) => void;
}

/**
 * Visão em quadro.
 *
 * No celular as colunas rolam na horizontal com encaixe (scroll-snap) e ocupam
 * 85% da largura — sobra uma fresta da próxima coluna, que é o que avisa ao
 * usuário que existe mais para o lado. Empilhar as três colunas em uma só
 * transformaria o quadro numa lista pior do que a lista.
 */
export default function TaskBoard({ tasks, subtasksOf, onMove, onEdit, onDelete, onToggle }: TaskBoardProps) {
  return (
    <div
      className="flex gap-3 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible px-4 sm:px-5 py-4"
      style={{ scrollbarWidth: 'thin' }}
    >
      {BOARD_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => statusOf(t) === column.id);
        return (
          <section
            key={column.id}
            aria-label={`${column.label} — ${columnTasks.length} tarefas`}
            className="snap-start shrink-0 w-[85%] sm:w-[19rem] md:w-auto flex flex-col gap-2.5"
          >
            <header className="flex items-center justify-between pb-2 border-b" style={{ borderColor: column.tone }}>
              <h3 className="text-sm font-semibold" style={{ color: column.tone }}>
                {column.label}
              </h3>
              <span className="text-xs font-mono text-fg-soft tabular">{columnTasks.length}</span>
            </header>

            {columnTasks.length === 0 ? (
              <p className="text-xs text-fg-soft py-6 text-center">Vazio</p>
            ) : (
              columnTasks.map((task) => (
                <BoardCard
                  key={task.id}
                  task={task}
                  subtasks={subtasksOf(task.id)}
                  onMove={onMove}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggle={onToggle}
                />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}

function BoardCard({
  task,
  subtasks,
  onMove,
  onEdit,
  onDelete,
  onToggle,
}: {
  task: Task;
  subtasks: Task[];
  onMove: (task: Task, status: BoardStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggle: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const progress = computeProgress(subtasks);

  return (
    <article className="relative rounded-lg border border-edge p-3.5" style={{ background: 'var(--c-raised)' }}>
      <div className="flex items-start justify-between gap-2">
        <h4 className={`text-sm font-medium leading-snug ${task.is_completed ? 'line-through text-fg-soft' : ''}`}>
          {task.title}
        </h4>
        <div className="flex shrink-0 -mr-1.5 -mt-1">
          <button type="button" onClick={() => onEdit(task)} className="btn-icon h-8 w-8" aria-label={`Editar ${task.title}`}>
            <IconEdit size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="btn-icon h-8 w-8 hover:text-alert"
            aria-label={`Excluir ${task.title}`}
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {(task.priority === 'high' || task.priority === 'low' || (task.recurrence && task.recurrence !== 'none')) && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <PriorityBadge priority={task.priority} />
          <RecurrenceBadge recurrence={task.recurrence} />
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center justify-between w-full text-2xs font-mono text-fg-soft hover:text-fg"
          >
            <span>
              {progress.done}/{progress.total} etapas
            </span>
            <span>{open ? 'ocultar' : 'ver'}</span>
          </button>

          <div
            className="h-1 rounded-full overflow-hidden bg-panel mt-1.5"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Etapas de ${task.title}`}
          >
            <div
              className="h-full transition-[width] duration-300"
              style={{ width: `${progress.percent}%`, background: 'var(--c-flow)' }}
            />
          </div>

          {open && (
            <ul className="mt-2.5 space-y-1.5">
              {subtasks.map((sub) => (
                <li key={sub.id} className="flex items-center gap-2">
                  <label className="check-hit" aria-label={`Concluir etapa ${sub.title}`}>
                    <input
                      type="checkbox"
                      checked={sub.is_completed}
                      onChange={() => onToggle(sub)}
                      className="check w-4 h-4"
                    />
                  </label>
                  <span className={`text-xs truncate ${sub.is_completed ? 'line-through text-fg-soft' : 'text-fg-muted'}`}>
                    {sub.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3.5 pt-3 border-t border-edge">
        <label className="sr-only" htmlFor={`move-${task.id}`}>
          Mover “{task.title}” de coluna
        </label>
        <select
          id={`move-${task.id}`}
          value={statusOf(task)}
          onChange={(e) => onMove(task, e.target.value as BoardStatus)}
          className="field py-1.5 text-xs"
        >
          {BOARD_COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
