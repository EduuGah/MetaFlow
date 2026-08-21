import { useState } from 'react';
import type { Task } from '../../types';
import { computeProgress } from '../../lib/progress';
import { IconEdit, IconTrash } from '../Icon';
import { PriorityBadge, RecurrenceBadge, TaskDeadlineBadge } from './TaskBadges';
import { BOARD_COLUMNS, statusOf, type BoardStatus } from './board';

interface TaskBoardProps {
  tasks: Task[];
  stepsOf: (id: string) => Task[];
  onMove: (task: Task, status: BoardStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggle: (task: Task) => void;
}

/** Tipo próprio no dataTransfer: impede que o quadro aceite arquivo ou texto solto. */
const DRAG_TYPE = 'application/x-metaflow-task';

/**
 * Visão em quadro.
 *
 * No celular as colunas rolam na horizontal com encaixe (scroll-snap) e ocupam
 * 85% da largura — sobra uma fresta da próxima coluna, que é o que avisa ao
 * usuário que existe mais para o lado. Empilhar as três colunas em uma só
 * transformaria o quadro numa lista pior do que a lista.
 *
 * Arrastar move o card de coluna, mas é só o atalho do mouse. O seletor no pé
 * de cada card continua sendo o caminho oficial: é ele que funciona no
 * celular, onde arrastar não existe, e no teclado, onde arrastar não é
 * alcançável. Nenhuma ação do quadro depende de segurar o botão do mouse.
 */
export default function TaskBoard({ tasks, stepsOf, onMove, onEdit, onDelete, onToggle }: TaskBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardStatus | null>(null);

  const drop = (event: React.DragEvent, column: BoardStatus) => {
    event.preventDefault();
    setOverColumn(null);
    setDraggingId(null);

    const id = event.dataTransfer.getData(DRAG_TYPE);
    const task = tasks.find((t) => t.id === id);
    if (task) onMove(task, column);
  };

  return (
    <div
      className="flex gap-3 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible px-4 sm:px-5 py-4"
      style={{ scrollbarWidth: 'thin' }}
    >
      {BOARD_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => statusOf(t) === column.id);
        const isTarget = overColumn === column.id && draggingId !== null;

        return (
          <section
            key={column.id}
            aria-label={`${column.label} — ${columnTasks.length} tarefas`}
            onDragOver={(event) => {
              if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
              // Sem o preventDefault o navegador recusa a soltura — é assim
              // que a API de arrastar diz "esta área aceita o que vem aí".
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setOverColumn(column.id);
            }}
            onDragLeave={(event) => {
              // Sair para um filho ainda é estar dentro da coluna.
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setOverColumn((prev) => (prev === column.id ? null : prev));
            }}
            onDrop={(event) => drop(event, column.id)}
            className="snap-start shrink-0 w-[85%] sm:w-[19rem] md:w-auto flex flex-col gap-2.5 rounded-lg transition-colors"
            style={isTarget ? { background: 'var(--c-signal-soft)', outline: '1px dashed var(--c-signal)' } : undefined}
          >
            <header className="flex items-center justify-between pb-2 border-b" style={{ borderColor: column.tone }}>
              <h3 className="text-sm font-semibold" style={{ color: column.tone }}>
                {column.label}
              </h3>
              <span className="text-xs font-mono text-fg-soft tabular">{columnTasks.length}</span>
            </header>

            {columnTasks.length === 0 ? (
              <p className="text-xs text-fg-soft py-6 text-center">{isTarget ? 'Solte aqui' : 'Vazio'}</p>
            ) : (
              columnTasks.map((task) => (
                <BoardCard
                  key={task.id}
                  task={task}
                  subtasks={stepsOf(task.id)}
                  dragging={draggingId === task.id}
                  onDragStart={setDraggingId}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverColumn(null);
                  }}
                  onMove={onMove}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggle={onToggle}
                />
              ))
            )}

            {/* Uma faixa de sobra no fim da coluna: sem ela, soltar embaixo do
                último card cairia fora da área que aceita a soltura. */}
            {isTarget && columnTasks.length > 0 && (
              <p className="text-2xs text-signal text-center py-3 rounded-md border border-dashed border-signal">
                Solte aqui
              </p>
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
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
  onEdit,
  onDelete,
  onToggle,
}: {
  task: Task;
  subtasks: Task[];
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onMove: (task: Task, status: BoardStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggle: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const [grabbable, setGrabbable] = useState(false);
  const progress = computeProgress(subtasks);

  /**
   * O card só vira arrastável quando o clique começa fora de um controle.
   *
   * Com `draggable` fixo em true, o seletor de coluna dentro do card não abre
   * no Firefox e os botões viram alvo de arrasto em vez de alvo de clique.
   * Decidir no pointerdown resolve os dois sem tirar o arrasto do card.
   */
  const armDrag = (event: React.PointerEvent) => {
    const origin = event.target as HTMLElement | null;
    setGrabbable(!origin?.closest('button, select, input, label, a'));
  };

  return (
    <article
      draggable={grabbable}
      onPointerDown={armDrag}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, task.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(task.id);
      }}
      onDragEnd={() => {
        setGrabbable(false);
        onDragEnd();
      }}
      className="relative rounded-lg border border-edge p-3.5 transition-opacity"
      style={{
        background: 'var(--c-raised)',
        opacity: dragging ? 0.45 : 1,
        cursor: grabbable ? 'grab' : undefined,
      }}
    >
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

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        <PriorityBadge priority={task.priority} />
        <TaskDeadlineBadge deadline={task.deadline} done={task.is_completed} />
        <RecurrenceBadge recurrence={task.recurrence} />
      </div>

      {/* Duas linhas de nota no card. O card é um cartão de parede: se a
          anotação for longa, ela pertence à lista ou ao formulário. */}
      {task.notes && (
        <p className="text-xs text-fg-muted mt-2.5 whitespace-pre-line line-clamp-2">{task.notes}</p>
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
