import { useCallback, useState } from 'react';
import type { Task } from '../../types';
import { computeProgress } from '../../lib/progress';
import { MAX_DEPTH } from '../../lib/tree';
import { cn } from '../../lib/utils';
import { IconChevron, IconEdit, IconPlus, IconTrash } from '../Icon';
import { PriorityBadge, RecurrenceBadge } from './TaskBadges';

export interface TaskHandlers {
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (parentId: string, title: string) => Promise<boolean>;
  onReorder: (task: Task, direction: -1 | 1) => void;
}

interface TaskListProps extends TaskHandlers {
  tasks: Task[];
  subtasksOf: (id: string) => Task[];
  /** Falso enquanto houver busca ou filtro: "para cima" não teria sentido. */
  reorderable: boolean;
}

/**
 * Quais tarefas estão recolhidas fica no navegador, não no banco.
 *
 * É preferência de leitura, não dado do projeto: quem recolhe uma tarefa de
 * doze etapas quer ela recolhida amanhã também, mas não faz sentido gravar
 * isso no Supabase nem sincronizar entre aparelhos. Os ids são UUID, então
 * uma lista só serve para todos os projetos e todos os níveis.
 */
const STORAGE_KEY = 'metaflow:etapas-recolhidas';

function readCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    // Navegação privada e storage bloqueado caem aqui: tudo aberto, sem quebrar.
    return new Set();
  }
}

/**
 * Visão em lista: uma linha por tarefa, com as etapas recuadas sob um fio.
 *
 * A árvore desce até três níveis (ver `MAX_DEPTH`) e o mesmo componente
 * desenha todos eles — o que muda com a profundidade é o peso: a raiz tem
 * título maior, barra de progresso e selo de prioridade padrão; os níveis de
 * dentro ficam compactos, para o recuo não comer a linha no celular.
 */
export default function TaskList({
  tasks,
  subtasksOf,
  reorderable,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onReorder,
}: TaskListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* sem storage, a preferência vale só para esta sessão */
      }
      return next;
    });
  }, []);

  return (
    <ul className="divide-y divide-edge">
      {tasks.map((task, index) => (
        <TaskNode
          key={task.id}
          task={task}
          depth={0}
          index={index}
          siblingCount={tasks.length}
          subtasksOf={subtasksOf}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          reorderable={reorderable}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
          onReorder={onReorder}
        />
      ))}
    </ul>
  );
}

function TaskNode({
  task,
  depth,
  index,
  siblingCount,
  subtasksOf,
  collapsed,
  onToggleCollapsed,
  reorderable,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onReorder,
}: TaskHandlers & {
  task: Task;
  depth: number;
  index: number;
  siblingCount: number;
  subtasksOf: (id: string) => Task[];
  collapsed: Set<string>;
  onToggleCollapsed: (id: string) => void;
  reorderable: boolean;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const children = subtasksOf(task.id);
  const progress = computeProgress(children);
  const isRoot = depth === 0;
  const isCollapsed = collapsed.has(task.id);
  const canNest = depth < MAX_DEPTH;
  const stepsId = `etapas-${task.id}`;
  const noun = isRoot ? 'tarefa' : 'etapa';

  const submitSubtask = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title || busy) return;
    setBusy(true);
    const ok = await onAddSubtask(task.id, title);
    setBusy(false);
    if (ok) setDraft('');
  };

  // Nos níveis de dentro as ações só aparecem no hover (desktop) e encolhem
  // para 28px — três botões de 36 não cabem depois de dois recuos.
  const actionSize = isRoot ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-7 w-7';
  const iconSize = isRoot ? 16 : 14;

  return (
    <li className={isRoot ? 'px-4 sm:px-5 py-3.5' : 'py-1'}>
      <div className="flex items-start gap-2.5 sm:gap-3 group">
        {/* Setas de ordem numa coluna de 24px — o mínimo de alvo que a WCAG
            2.2 aceita, e o que cabe sem espremer o título no celular. Elas
            ficam desabilitadas com filtro ligado: mover para cima numa lista
            filtrada moveria a tarefa para um lugar que ninguém está vendo. */}
        {siblingCount > 1 && (
          <div className="flex flex-col shrink-0 -ml-1 mt-px">
            <button
              type="button"
              disabled={!reorderable || index === 0}
              onClick={() => onReorder(task, -1)}
              title={reorderable ? 'Mover para cima' : 'Limpe os filtros para reordenar'}
              className="btn-icon h-6 w-6 disabled:opacity-30"
              aria-label={`Mover ${task.title} para cima`}
            >
              <IconChevron size={13} style={{ transform: 'rotate(-90deg)' }} />
            </button>
            <button
              type="button"
              disabled={!reorderable || index === siblingCount - 1}
              onClick={() => onReorder(task, 1)}
              title={reorderable ? 'Mover para baixo' : 'Limpe os filtros para reordenar'}
              className="btn-icon h-6 w-6 disabled:opacity-30"
              aria-label={`Mover ${task.title} para baixo`}
            >
              <IconChevron size={13} style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>
        )}

        <label className="check-hit mt-px" aria-label={`Concluir ${task.title}`}>
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={() => onToggle(task)}
            className={cn('check', !isRoot && 'w-4 h-4')}
          />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                isRoot ? 'font-medium text-[0.9375rem]' : 'text-sm',
                task.is_completed ? 'line-through text-fg-soft' : isRoot ? 'text-fg' : 'text-fg-muted'
              )}
            >
              {task.title}
            </span>
            <PriorityBadge priority={task.priority} quiet={!isRoot} />
            <RecurrenceBadge recurrence={task.recurrence} />
          </div>

          {/* A nota aparece inteira até três linhas e para por aí: ela é
              lembrete dentro da lista, não um documento. O texto completo
              continua no formulário de edição. */}
          {task.notes && (
            <p
              className={cn(
                'whitespace-pre-line mt-1.5',
                isRoot ? 'text-sm text-fg-muted line-clamp-3' : 'text-xs text-fg-soft line-clamp-2'
              )}
            >
              {task.notes}
            </p>
          )}

          {/* O resumo das etapas é também o botão de recolher. Um segundo
              botão ao lado só somaria alvo de clique numa linha que já tem
              três — e o resumo é justamente o que sobra quando tudo fecha. */}
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleCollapsed(task.id)}
              aria-expanded={!isCollapsed}
              aria-controls={stepsId}
              aria-label={`${isCollapsed ? 'Mostrar' : 'Recolher'} as ${progress.total} etapas de ${task.title}`}
              className={cn(
                'flex items-center gap-2 mt-2 rounded-sm focus-inset text-left',
                isRoot ? 'w-full max-w-xs' : ''
              )}
            >
              <span
                className="text-fg-soft shrink-0 transition-transform duration-200"
                style={{ transform: isCollapsed ? 'none' : 'rotate(90deg)' }}
              >
                <IconChevron size={13} />
              </span>

              {/* A barra só na raiz. Nos níveis de dentro ela ficaria com
                  poucos pixels de largura útil e diria menos que o número. */}
              {isRoot && (
                <span
                  className="h-1 flex-1 rounded-full overflow-hidden bg-raised"
                  role="progressbar"
                  aria-valuenow={progress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Etapas de ${task.title}`}
                >
                  <span
                    className="block h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${progress.percent}%`, background: 'var(--c-flow)' }}
                  />
                </span>
              )}

              <span className="text-2xs font-mono text-fg-soft shrink-0">
                {progress.done}/{progress.total} etapas
              </span>
            </button>
          )}
        </div>

        {/* No celular os alvos encolhem de 36 para 32px: três botões de 36
            comem quase um terço da largura da linha e espremem o título. */}
        <div
          className={cn(
            'flex items-center shrink-0',
            !isRoot && 'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity'
          )}
        >
          {canNest && (
            <button
              type="button"
              onClick={() => setComposerOpen((v) => !v)}
              aria-expanded={composerOpen}
              title="Adicionar etapa"
              className={cn('btn-icon', actionSize)}
              aria-label={`Adicionar etapa em ${task.title}`}
            >
              <IconPlus size={iconSize} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(task)}
            title={`Editar ${noun}`}
            className={cn('btn-icon', actionSize)}
            aria-label={`Editar ${task.title}`}
          >
            <IconEdit size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            title={`Excluir ${noun}`}
            className={cn('btn-icon hover:text-alert', actionSize)}
            aria-label={`Excluir ${task.title}`}
          >
            <IconTrash size={iconSize} />
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

      {children.length > 0 && !isCollapsed && (
        <ul id={stepsId} className="mt-2.5 ml-3 pl-4 border-l border-edge space-y-0.5 animate-rise">
          {children.map((child, childIndex) => (
            <TaskNode
              key={child.id}
              task={child}
              depth={depth + 1}
              index={childIndex}
              siblingCount={children.length}
              subtasksOf={subtasksOf}
              collapsed={collapsed}
              onToggleCollapsed={onToggleCollapsed}
              reorderable={reorderable}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onReorder={onReorder}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
