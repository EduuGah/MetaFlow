import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useSeo } from '../lib/seo';
import { reportError, userMessage } from '../lib/logger';
import { computeProgress } from '../lib/progress';
import { orderTasks, positionUpdates, swap } from '../lib/order';
import { descendantsOf } from '../lib/tree';
import { formatDeadlineLong, getDeadlineInfo } from '../lib/deadline';
import { findTasksDueForReset, RECURRENCE_OPTIONS } from '../lib/recurrence';
import AppHeader from '../components/AppHeader';
import ProgressDial from '../components/ProgressDial';
import ConfirmModal from '../components/ConfirmModal';
import EditTaskModal from '../components/EditTaskModal';
import ProjectFormModal from '../components/ProjectFormModal';
import { Skeleton, TaskSkeleton } from '../components/Skeleton';
import TaskList from '../components/task/TaskList';
import TaskBoard from '../components/task/TaskBoard';
import { statusOf, type BoardStatus } from '../components/task/board';
import { IconBoard, IconList, IconPlus, IconSearch } from '../components/Icon';
import { useAuth } from '../context/AuthContext';

type StatusFilter = 'all' | 'pending' | 'done';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const [view, setView] = useState<'list' | 'board'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const [draft, setDraft] = useState('');
  const [draftPriority, setDraftPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [draftRecurrence, setDraftRecurrence] = useState('none');
  const [creating, setCreating] = useState(false);
  const draftRef = useRef<HTMLInputElement>(null);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useSeo({
    path: `/dashboard/${id ?? ''}`,
    title: project ? project.title : 'Projeto',
    description: 'Tarefas, etapas e progresso do projeto no MetaFlow.',
    noindex: true,
  });

  /* ---------------- carga ---------------- */

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    const [projectRes, tasksRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).maybeSingle(),
      supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
    ]);

    // Distinguir "não existe" de "deu erro" importa: a primeira situação é um
    // beco sem saída e a segunda tem conserto. Antes as duas caíam na mesma
    // frase, "Projeto não encontrado".
    if (projectRes.error || tasksRes.error) {
      reportError('project.load', projectRes.error ?? tasksRes.error, { projectId: id });
      setLoadError(userMessage('Não conseguimos abrir este projeto.', projectRes.error ?? tasksRes.error));
      setLoading(false);
      return;
    }

    if (!projectRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProject(projectRes.data as Project);

    // A consulta vem por data de criação; a ordem que vale é a manual.
    const fetched = orderTasks((tasksRes.data ?? []) as Task[]);
    const dueForReset = findTasksDueForReset(fetched);

    if (dueForReset.length > 0) {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: false, status: 'todo', last_completed_at: null })
        .in('id', dueForReset);

      if (error) {
        reportError('tasks.recurrenceReset', error, { count: dueForReset.length });
        setTasks(fetched);
      } else {
        setTasks(
          fetched.map((t) =>
            dueForReset.includes(t.id)
              ? { ...t, is_completed: false, status: 'todo' as const, last_completed_at: null }
              : t
          )
        );
        setAnnouncement(
          dueForReset.length === 1
            ? '1 tarefa recorrente voltou para a fazer.'
            : `${dueForReset.length} tarefas recorrentes voltaram para a fazer.`
        );
      }
    } else {
      setTasks(fetched);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- operações ---------------- */

  /**
   * Próxima posição livre entre as irmãs.
   *
   * Sempre um a mais que a maior existente, em vez da contagem da lista: o
   * backfill do banco numerou a partir de 1 e o app conta a partir de 0, então
   * contar itens criaria empate com a última linha.
   */
  const nextPosition = (parentId: string | null) =>
    tasks.reduce((max, t) => (t.parent_id === parentId ? Math.max(max, t.position ?? -1) : max), -1) + 1;

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) {
      draftRef.current?.focus();
      return;
    }
    if (!id || creating) return;

    setCreating(true);
    // Inserir e já receber a linha de volta evita recarregar o projeto inteiro
    // a cada tarefa criada — antes a tela piscava em esqueleto toda vez.
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: id,
        title: title.slice(0, 160),
        is_completed: false,
        status: 'todo',
        parent_id: null,
        priority: draftPriority,
        recurrence: draftRecurrence,
        position: nextPosition(null),
      })
      .select()
      .single();
    setCreating(false);

    if (error || !data) {
      reportError('task.insert', error, { projectId: id });
      showToast(userMessage('Não foi possível criar a tarefa.', error), 'error');
      return;
    }

    setTasks((prev) => orderTasks([...prev, data as Task]));
    setDraft('');
    setDraftPriority('medium');
    setDraftRecurrence('none');
    setAnnouncement(`Tarefa “${title}” criada.`);
  };

  const addSubtask = async (parentId: string, title: string): Promise<boolean> => {
    if (!id) return false;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: id,
        title: title.slice(0, 160),
        is_completed: false,
        status: 'todo',
        parent_id: parentId,
        priority: 'medium',
        recurrence: 'none',
        position: nextPosition(parentId),
      })
      .select()
      .single();

    if (error || !data) {
      reportError('subtask.insert', error, { projectId: id, parentId });
      showToast(userMessage('Não foi possível adicionar a etapa.', error), 'error');
      return false;
    }

    setTasks((prev) => orderTasks([...prev, data as Task]));
    setAnnouncement(`Etapa “${title}” adicionada.`);
    return true;
  };

  /**
   * Move uma tarefa uma casa para cima ou para baixo entre as suas irmãs.
   *
   * A renumeração é da lista inteira, mas só as linhas que realmente mudaram
   * de número vão para o banco — numa lista já numerada isso são duas. A tela
   * muda antes da resposta; se o banco recusar, ela volta ao estado anterior.
   */
  const moveTask = async (task: Task, direction: -1 | 1) => {
    const siblings = tasks.filter((t) => t.parent_id === task.parent_id);
    const from = siblings.findIndex((t) => t.id === task.id);
    const reordered = swap(siblings, from, from + direction);
    if (reordered === siblings) return;

    const updates = positionUpdates(reordered);
    if (updates.length === 0) return;

    const snapshot = tasks;
    const byId = new Map(updates.map((row) => [row.id, row.position]));

    setTasks((prev) =>
      orderTasks(prev.map((t) => (byId.has(t.id) ? { ...t, position: byId.get(t.id) as number } : t)))
    );
    setAnnouncement(`“${task.title}” agora é a ${from + direction + 1}ª de ${siblings.length}.`);

    const results = await Promise.all(
      updates.map((row) => supabase.from('tasks').update({ position: row.position }).eq('id', row.id))
    );
    const failure = results.find((result) => result.error)?.error;

    if (failure) {
      reportError('task.reorder', failure, { taskId: task.id });
      setTasks(snapshot);
      showToast(userMessage('A nova ordem não foi salva.', failure), 'error');
    }
  };

  /**
   * Uma única função para marcar/desmarcar e para mover de coluna: as duas
   * ações escrevem exatamente os mesmos três campos. Antes eram dois blocos
   * quase idênticos, e só um deles desfazia a alteração quando dava erro.
   *
   * Nada de aviso na tela quando dá certo — quem marca dez etapas seguidas não
   * quer dez avisos. O sucesso já está visível na própria caixa marcada; o
   * anúncio vai para a região `aria-live`, para quem usa leitor de tela.
   */
  const applyStatus = async (task: Task, status: BoardStatus) => {
    const isDone = status === 'done';
    const completedAt = isDone ? new Date().toISOString() : null;
    const snapshot = tasks;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status, is_completed: isDone, last_completed_at: completedAt } : t
      )
    );
    setAnnouncement(`${task.title}: ${isDone ? 'concluída' : status === 'in_progress' ? 'em andamento' : 'a fazer'}.`);

    const { error } = await supabase
      .from('tasks')
      .update({ status, is_completed: isDone, last_completed_at: completedAt })
      .eq('id', task.id);

    if (error) {
      reportError('task.status', error, { taskId: task.id });
      setTasks(snapshot);
      showToast(userMessage('A alteração não foi salva.', error), 'error');
    }
  };

  const toggleTask = (task: Task) => applyStatus(task, task.is_completed ? 'todo' : 'done');

  /**
   * Recria as linhas excluídas com os mesmos ids.
   *
   * Preservar `id` e `created_at` é o que faz a tarefa voltar para o mesmo
   * lugar da ordenação, com as etapas ainda apontando para ela. A tarefa
   * principal vai primeiro no array: o Postgres só confere a chave
   * estrangeira no fim do INSERT, mas a ordem deixa a intenção legível.
   */
  const restoreTasks = async (rows: Task[]) => {
    const payload = rows.map((task) => ({
      id: task.id,
      project_id: task.project_id,
      parent_id: task.parent_id,
      title: task.title,
      is_completed: task.is_completed,
      status: task.status ?? (task.is_completed ? 'done' : 'todo'),
      priority: task.priority ?? 'medium',
      recurrence: task.recurrence ?? 'none',
      last_completed_at: task.last_completed_at ?? null,
      notes: task.notes ?? null,
      position: task.position ?? null,
      created_at: task.created_at,
    }));

    const { error } = await supabase.from('tasks').insert(payload);

    if (error) {
      reportError('task.restore', error, { count: payload.length });
      showToast(userMessage('Não foi possível restaurar.', error), 'error');
      return;
    }

    setTasks((prev) => orderTasks([...prev, ...rows]));
    setAnnouncement(`“${rows[0].title}” foi restaurada.`);
  };

  /**
   * Excluir some da tela na hora, mas não é definitivo: o aviso carrega um
   * "Desfazer" com o conteúdo do que saiu — a tarefa e a sua árvore inteira,
   * porque apagar o pai leva todos os descendentes por cascata no banco.
   * `descendantsOf` desce todos os níveis; filtrar por `parent_id` deixaria
   * um neto órfão na tela e fora do desfazer.
   */
  const deleteTask = async () => {
    if (!taskToDelete) return;
    const target = taskToDelete;
    const removedSteps = descendantsOf(tasks, target.id);
    const removedIds = new Set([target.id, ...removedSteps.map((t) => t.id)]);
    const snapshot = tasks;

    setTasks((prev) => prev.filter((t) => !removedIds.has(t.id)));
    setTaskToDelete(null);

    const { error } = await supabase.from('tasks').delete().eq('id', target.id);

    if (error) {
      reportError('task.delete', error, { taskId: target.id });
      setTasks(snapshot);
      showToast(userMessage('Não foi possível excluir.', error), 'error');
      return;
    }

    showToast(target.parent_id ? 'Etapa excluída.' : 'Tarefa excluída.', 'info', {
      label: 'Desfazer',
      onClick: () => restoreTasks([target, ...removedSteps]),
    });
  };

  /* ---------------- derivados ---------------- */

  /** Filhos diretos — é do que a lista precisa para desenhar um nível de cada vez. */
  const subtasksOf = useCallback((parentId: string) => tasks.filter((t) => t.parent_id === parentId), [tasks]);

  /**
   * Árvore inteira abaixo de uma tarefa. O quadro é um resumo: ele conta e
   * lista todas as etapas de uma vez, sem recuo, porque um card de coluna não
   * tem largura para representar três níveis.
   */
  const allStepsOf = useCallback((taskId: string) => descendantsOf(tasks, taskId), [tasks]);

  const mainTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks]);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return mainTasks.filter((task) => {
      if (statusFilter === 'pending' && task.is_completed) return false;
      if (statusFilter === 'done' && !task.is_completed) return false;
      if (priorityFilter !== 'all' && (task.priority ?? 'medium') !== priorityFilter) return false;
      if (!term) return true;
      // A busca desce a árvore inteira: achar "tinta" na subetapa tem de
      // trazer à tona a tarefa de topo que a contém, senão o resultado some.
      return (
        task.title.toLowerCase().includes(term) ||
        descendantsOf(tasks, task.id).some((step) => step.title.toLowerCase().includes(term))
      );
    });
  }, [mainTasks, tasks, search, statusFilter, priorityFilter]);

  const progress = computeProgress(tasks);
  const filtersActive = Boolean(search.trim()) || statusFilter !== 'all' || priorityFilter !== 'all';

  /* ---------------- telas de exceção ---------------- */

  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <ExceptionScreen
        eyebrow="Projeto"
        title="Este projeto não existe mais"
        body="Ele pode ter sido excluído, ou o endereço veio incompleto. O painel mostra tudo o que está na sua conta."
      />
    );
  }

  if (loadError || !project) {
    return (
      <ExceptionScreen
        eyebrow="Erro"
        title={loadError ?? 'Não conseguimos abrir este projeto.'}
        body="A conexão pode ter falhado no meio do caminho. Seus dados seguem salvos."
        onRetry={load}
      />
    );
  }

  const deadline = getDeadlineInfo(project.deadline);
  const deadlineLong = formatDeadlineLong(project.deadline);

  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />

      <main className="shell flex-1 py-6 sm:py-8 space-y-4">
        <nav aria-label="Você está em" className="text-sm">
          <Link to="/dashboard" className="text-fg-soft hover:text-fg">
            Painel
          </Link>
          <span className="text-fg-soft mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-fg-muted">{project.title}</span>
        </nav>

        {/* -------- cabeçalho do projeto -------- */}
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <ProgressDial
              value={progress.percent}
              size={56}
              label={`Progresso de ${project.title}`}
              tone={progress.done === 0 ? 'signal' : 'flow'}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl">{project.title}</h1>
                <span className="chip chip-static text-2xs">{project.category || 'Geral'}</span>
              </div>

              {project.description && <p className="text-sm text-fg-muted mt-2.5 max-w-prose">{project.description}</p>}

              <p className="text-xs font-mono text-fg-soft mt-3">
                {progress.done}/{progress.total} {progress.total === 1 ? 'tarefa' : 'tarefas'}
                {deadlineLong && (
                  <>
                    {' · '}
                    <span
                      style={
                        deadline.tone === 'alert'
                          ? { color: 'var(--c-alert)' }
                          : deadline.tone === 'signal'
                            ? { color: 'var(--c-signal)' }
                            : undefined
                      }
                    >
                      {deadline.label}
                    </span>{' '}
                    <span className="text-fg-soft">({deadlineLong})</span>
                  </>
                )}
              </p>
            </div>

            {/* No desktop a ação fica na mesma linha; no celular ela vira um
                botão de largura inteira embaixo, em vez de espremer o título. */}
            <button
              type="button"
              onClick={() => setProjectFormOpen(true)}
              className="btn btn-secondary shrink-0 self-start hidden sm:inline-flex"
            >
              Editar projeto
            </button>
          </div>

          <button
            type="button"
            onClick={() => setProjectFormOpen(true)}
            className="btn btn-secondary w-full mt-5 sm:hidden"
          >
            Editar projeto
          </button>
        </section>

        {/* -------- tarefas -------- */}
        <section className="panel overflow-hidden">
          <div className="px-4 sm:px-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg">Tarefas</h2>

              <div
                role="group"
                aria-label="Modo de visualização"
                className="flex p-0.5 rounded-md border border-edge"
                style={{ background: 'var(--c-raised)' }}
              >
                <ViewButton active={view === 'list'} onClick={() => setView('list')} label="Lista">
                  <IconList size={15} />
                </ViewButton>
                <ViewButton active={view === 'board'} onClick={() => setView('board')} label="Quadro">
                  <IconBoard size={15} />
                </ViewButton>
              </div>
            </div>

            {/* Composição de tarefa. As opções só aparecem depois que existe um
                título — no celular isso deixa a caixa com uma linha só. */}
            <form onSubmit={createTask}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  maxLength={160}
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder="O que precisa ser feito?"
                  aria-label="Título da nova tarefa"
                  ref={draftRef}
                  onChange={(e) => setDraft(e.target.value)}
                  className="field flex-1"
                />
                {/* O botão continua sólido com o campo vazio: um CTA principal
                    permanentemente apagado parece defeito. Enviar sem título
                    devolve o foco ao campo, que é a correção que falta fazer. */}
                <button
                  type="submit"
                  disabled={creating}
                  data-busy={creating || undefined}
                  className="btn btn-primary"
                >
                  <IconPlus size={15} />
                  <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>

              {draft.trim() && (
                <div className="grid grid-cols-2 gap-2 mt-2 animate-rise">
                  <div>
                    <label className="sr-only" htmlFor="new-priority">
                      Prioridade da nova tarefa
                    </label>
                    <select
                      id="new-priority"
                      value={draftPriority}
                      onChange={(e) => setDraftPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="field py-2 text-xs"
                    >
                      <option value="low">Prioridade baixa</option>
                      <option value="medium">Prioridade média</option>
                      <option value="high">Prioridade alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="new-recurrence">
                      Repetição da nova tarefa
                    </label>
                    <select
                      id="new-recurrence"
                      value={draftRecurrence}
                      onChange={(e) => setDraftRecurrence(e.target.value)}
                      className="field py-2 text-xs"
                    >
                      {RECURRENCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </form>
          </div>

          {mainTasks.length > 0 && (
            <div className="px-4 sm:px-5 py-3 border-y border-edge flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-soft pointer-events-none">
                  <IconSearch size={15} />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tarefa ou etapa"
                  aria-label="Buscar tarefa ou etapa"
                  className="field pl-9 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:flex gap-2">
                <label className="sr-only" htmlFor="filter-status">
                  Filtrar por situação
                </label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="field py-2 text-xs sm:w-40"
                >
                  <option value="all">Todas as situações</option>
                  <option value="pending">Em aberto</option>
                  <option value="done">Concluídas</option>
                </select>

                <label className="sr-only" htmlFor="filter-priority">
                  Filtrar por prioridade
                </label>
                <select
                  id="filter-priority"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                  className="field py-2 text-xs sm:w-40"
                >
                  <option value="all">Todas as prioridades</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>
          )}

          {mainTasks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-fg">Nenhuma tarefa ainda.</p>
              <p className="text-sm text-fg-muted mt-2 max-w-prose mx-auto">
                Escreva o primeiro passo no campo acima. Depois dá para quebrar cada tarefa em etapas menores.
              </p>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-fg">Nada corresponde a esses filtros.</p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="btn btn-secondary mt-5"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : view === 'list' ? (
            <TaskList
              tasks={visibleTasks}
              subtasksOf={subtasksOf}
              reorderable={!filtersActive}
              onToggle={toggleTask}
              onEdit={setTaskToEdit}
              onDelete={setTaskToDelete}
              onAddSubtask={addSubtask}
              onReorder={moveTask}
            />
          ) : (
            <TaskBoard
              tasks={visibleTasks}
              stepsOf={allStepsOf}
              onMove={(task, status) => statusOf(task) !== status && applyStatus(task, status)}
              onToggle={toggleTask}
              onEdit={setTaskToEdit}
              onDelete={setTaskToDelete}
            />
          )}
        </section>

        {/* Região de anúncios: o que muda em silêncio na tela é dito aqui. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </main>

      {user && (
        <ProjectFormModal
          open={projectFormOpen}
          project={project}
          userId={user.id}
          onClose={() => setProjectFormOpen(false)}
          onSaved={load}
        />
      )}

      <EditTaskModal
        open={Boolean(taskToEdit)}
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSaved={load}
      />

      <ConfirmModal
        open={Boolean(taskToDelete)}
        title={taskToDelete?.parent_id ? 'Excluir etapa' : 'Excluir tarefa'}
        message={deleteMessage(taskToDelete, tasks)}
        confirmText="Excluir"
        onConfirm={deleteTask}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * O texto da confirmação de exclusão.
 *
 * Duas coisas mudaram e a frase tinha de acompanhar: a exclusão agora desce
 * por toda a árvore, então o número de etapas afetadas precisa aparecer, e ela
 * deixou de ser definitiva — prometer "não dá para desfazer" com um botão de
 * desfazer logo em seguida seria assustar por nada.
 */
function deleteMessage(task: Task | null, tasks: Task[]): string {
  if (!task) return '';

  const steps = descendantsOf(tasks, task.id).length;
  const scope =
    steps === 0
      ? `“${task.title}” sai da lista.`
      : steps === 1
        ? `“${task.title}” e a etapa dentro dela saem da lista.`
        : `“${task.title}” e as ${steps} etapas dentro dela saem da lista.`;

  return `${scope} Dá para desfazer no aviso que aparece em seguida.`;
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors focus-inset"
      style={active ? { background: 'var(--c-panel)', color: 'var(--c-fg)' } : { color: 'var(--c-fg-soft)' }}
    >
      {children}
      {label}
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <div className="shell py-6 sm:py-8 space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-40" />
        <div className="panel p-5 sm:p-6 flex gap-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="panel overflow-hidden">
          <div className="p-5">
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="divide-y divide-edge border-t border-edge">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        </div>
        <span className="sr-only" role="status">
          Carregando o projeto…
        </span>
      </div>
    </div>
  );
}

function ExceptionScreen({
  eyebrow,
  title,
  body,
  onRetry,
}: {
  eyebrow: string;
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />
      <main className="shell flex-1 grid place-items-center py-16">
        <div className="panel p-8 sm:p-10 max-w-narrow w-full">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-2xl mt-3">{title}</h1>
          <p className="text-sm text-fg-muted mt-3 max-w-prose">{body}</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-7">
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn btn-primary btn-lg">
                Tentar de novo
              </button>
            )}
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              Voltar ao painel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
