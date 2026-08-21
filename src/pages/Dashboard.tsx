import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSeo } from '../lib/seo';
import { reportError, userMessage } from '../lib/logger';
import { getDeadlineInfo, type DeadlineStatus } from '../lib/deadline';
import { computeProgress } from '../lib/progress';
import AppHeader from '../components/AppHeader';
import DashboardStats from '../components/DashboardStats';
import ProgressDial from '../components/ProgressDial';
import ProjectFormModal from '../components/ProjectFormModal';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import ConfirmModal from '../components/ConfirmModal';
import { ProjectRowSkeleton, StatsSkeleton } from '../components/Skeleton';
import { IconEdit, IconPlus, IconTrash } from '../components/Icon';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

type DeadlineFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

const DEADLINE_FILTERS: { id: DeadlineFilter; label: string; matches: (s: DeadlineStatus) => boolean }[] = [
  { id: 'all', label: 'Todos', matches: () => true },
  { id: 'overdue', label: 'Atrasados', matches: (s) => s === 'overdue' },
  { id: 'today', label: 'Vencem hoje', matches: (s) => s === 'today' },
  { id: 'week', label: 'Próximos 7 dias', matches: (s) => s === 'soon' },
  { id: 'none', label: 'Sem prazo', matches: (s) => s === 'none' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  useSeo({
    path: '/dashboard',
    title: 'Painel',
    description: 'Seus projetos, prazos e progresso no MetaFlow.',
    noindex: true,
  });

  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [area, setArea] = useState('Todas');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    // O filtro por usuário é feito pelas políticas de RLS no banco: a consulta
    // nunca devolve linha de outra conta, mesmo que alguém altere este código.
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(*)')
      .order('created_at', { ascending: false });

    if (error) {
      reportError('projects.list', error);
      setLoadError(userMessage('Não conseguimos carregar seus projetos.', error));
      setLoading(false);
      return;
    }

    setProjects((data ?? []) as ProjectWithTasks[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const areas = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    projects.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [projects]);

  const counts = useMemo(() => {
    const acc: Record<DeadlineFilter, number> = { all: projects.length, overdue: 0, today: 0, week: 0, none: 0 };
    projects.forEach((p) => {
      const { status } = getDeadlineInfo(p.deadline);
      if (status === 'overdue') acc.overdue += 1;
      else if (status === 'today') acc.today += 1;
      else if (status === 'soon') acc.week += 1;
      else if (status === 'none') acc.none += 1;
    });
    return acc;
  }, [projects]);

  const visible = useMemo(() => {
    const rule = DEADLINE_FILTERS.find((f) => f.id === deadlineFilter) ?? DEADLINE_FILTERS[0];
    return projects.filter((p) => {
      if (area !== 'Todas' && (p.category || 'Geral') !== area) return false;
      return rule.matches(getDeadlineInfo(p.deadline).status);
    });
  }, [projects, area, deadlineFilter]);

  const clearFilters = () => {
    setArea('Todas');
    setDeadlineFilter('all');
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    const snapshot = projects;

    setProjects((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      reportError('project.delete', error, { projectId: id });
      setProjects(snapshot); // devolve a linha em vez de recarregar tudo
      showToast(userMessage('Não foi possível excluir o projeto.', error), 'error');
    } else {
      showToast('Projeto excluído.', 'info');
    }
    setPendingDelete(null);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />

      <main className="shell flex-1 py-7 sm:py-9 dock-safe sm:pb-12">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="eyebrow">Painel</p>
            <h1 className="text-2xl sm:text-3xl mt-2">Seus projetos</h1>
            {!loading && !loadError && projects.length > 0 && (
              <p className="text-sm text-fg-muted mt-2">
                {projects.length === 1 ? '1 projeto' : `${projects.length} projetos`}
                {counts.overdue > 0 && (
                  <>
                    {' · '}
                    <span className="text-alert">
                      {counts.overdue === 1 ? '1 atrasado' : `${counts.overdue} atrasados`}
                    </span>
                  </>
                )}
                {counts.today > 0 && (
                  <>
                    {' · '}
                    <span className="text-signal">
                      {counts.today === 1 ? '1 vence hoje' : `${counts.today} vencem hoje`}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* A ação principal fica no cabeçalho no desktop; no celular ela
              vira a barra fixa do rodapé, ao alcance do polegar. */}
          <button type="button" onClick={openNew} className="btn btn-primary hidden sm:inline-flex shrink-0">
            <IconPlus size={15} />
            Novo projeto
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="panel overflow-hidden">
              <StatsSkeleton />
            </div>
            <div className="panel overflow-hidden divide-y divide-edge">
              <ProjectRowSkeleton />
              <ProjectRowSkeleton />
              <ProjectRowSkeleton />
            </div>
            <span className="sr-only" role="status">
              Carregando seus projetos…
            </span>
          </div>
        ) : loadError ? (
          <div className="panel p-8 text-center">
            <h2 className="text-lg">{loadError}</h2>
            <p className="text-sm text-fg-muted mt-2 max-w-prose mx-auto">
              Nada foi perdido — os projetos continuam salvos no servidor.
            </p>
            <button type="button" onClick={fetchProjects} className="btn btn-primary btn-lg mt-6">
              Tentar de novo
            </button>
          </div>
        ) : projects.length === 0 ? (
          <FirstRun onCreate={openNew} />
        ) : (
          <div className="space-y-4">
            <DashboardStats projects={projects} />

            <div className="space-y-3">
              <FilterRow
                legend="Prazo"
                options={DEADLINE_FILTERS.map((f) => ({
                  id: f.id,
                  label: f.label,
                  count: f.id === 'all' ? undefined : counts[f.id],
                }))}
                value={deadlineFilter}
                onChange={(v) => setDeadlineFilter(v as DeadlineFilter)}
              />
              <FilterRow
                legend="Área"
                options={[{ id: 'Todas', label: 'Todas' }, ...areas.map((a) => ({ id: a, label: a }))]}
                value={area}
                onChange={setArea}
              />
            </div>

            {visible.length === 0 ? (
              <div className="panel p-10 text-center">
                <p className="text-fg">Nenhum projeto nesses filtros.</p>
                <button type="button" onClick={clearFilters} className="btn btn-secondary mt-5">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                <ul className="panel overflow-hidden divide-y divide-edge">
                  {visible.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      onEdit={() => {
                        setEditing(project);
                        setFormOpen(true);
                      }}
                      onDelete={() => setPendingDelete({ id: project.id, title: project.title })}
                    />
                  ))}
                </ul>
                <p aria-live="polite" className="sr-only">
                  {visible.length} projetos exibidos.
                </p>
              </>
            )}
          </div>
        )}
      </main>

      {/* Barra fixa do celular. Fora do fluxo, com respiro para a área segura. */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-edge shadow-dock"
        style={{ background: 'var(--c-panel)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="px-4 py-3">
          <button type="button" onClick={openNew} className="btn btn-primary btn-lg w-full">
            <IconPlus size={16} />
            Novo projeto
          </button>
        </div>
      </div>

      {user && (
        <ProjectFormModal
          open={formOpen}
          project={editing}
          userId={user.id}
          categories={areas}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={fetchProjects}
        />
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Excluir projeto"
        message={`“${pendingDelete?.title}” e todas as suas tarefas serão apagados. Não dá para desfazer.`}
        confirmText="Excluir projeto"
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectWithTasks;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { total, done, percent } = computeProgress(project.tasks);
  const deadline = getDeadlineInfo(project.deadline);

  const toneStyle =
    deadline.tone === 'alert'
      ? { color: 'var(--c-alert)', borderColor: 'var(--c-alert)' }
      : deadline.tone === 'signal'
        ? { color: 'var(--c-signal)', borderColor: 'var(--c-signal)' }
        : deadline.tone === 'flow'
          ? { color: 'var(--c-flow)', borderColor: 'var(--c-flow-soft)' }
          : undefined;

  return (
    // A linha inteira é o alvo do link (`after:absolute inset-0`): um só
    // destino, sem elemento interativo aninhado, e um alvo de toque grande no
    // celular. Os botões de ação ficam acima dele com `relative`.
    <li className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-raised transition-colors">
      <ProgressDial value={percent} size={48} label={`Progresso de ${project.title}`} tone={done === 0 ? 'signal' : 'flow'} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-display font-semibold text-base truncate">
            {/* O título é o link: alvo grande, destino óbvio, um só por linha. */}
            <Link
              to={`/dashboard/${project.id}`}
              className="hover:text-signal rounded-sm after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </Link>
          </h2>
          <span className="chip chip-static text-2xs" style={toneStyle}>
            {deadline.label}
          </span>
        </div>

        {/* A descrição sai no celular: cortada em uma linha ela não informa
            nada, e o espaço vale mais para o título e a leitura numérica. */}
        {project.description && (
          <p className="hidden sm:block text-sm text-fg-muted mt-1 line-clamp-1">{project.description}</p>
        )}

        <p className="text-xs font-mono text-fg-soft mt-1.5">
          {project.category || 'Geral'} ·{' '}
          {total === 0 ? 'nenhuma tarefa ainda' : `${done}/${total} ${total === 1 ? 'tarefa' : 'tarefas'}`}
        </p>
      </div>

      <div className="relative flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          title="Editar projeto"
          className="btn-icon h-8 w-8 sm:h-9 sm:w-9"
          aria-label={`Editar projeto ${project.title}`}
        >
          <IconEdit size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Excluir projeto"
          className="btn-icon h-8 w-8 sm:h-9 sm:w-9 hover:text-alert"
          aria-label={`Excluir projeto ${project.title}`}
        >
          <IconTrash size={16} />
        </button>
      </div>
    </li>
  );
}

function FilterRow({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="eyebrow shrink-0 w-10">{legend}</span>
      {/* Rolagem horizontal com máscara: no celular fica claro que há mais
          filtros à direita, sem empurrar a página para os lados. */}
      <div
        role="group"
        aria-label={`Filtrar por ${legend.toLowerCase()}`}
        className="flex gap-1.5 overflow-x-auto py-0.5 -my-0.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className="chip"
          >
            {option.label}
            {option.count !== undefined && option.count > 0 && (
              <span className="opacity-70">{option.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function FirstRun({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="panel p-8 sm:p-12">
      <div className="max-w-prose">
        <p className="eyebrow">Primeiro projeto</p>
        <h2 className="text-xl sm:text-2xl mt-3">Ainda não há nada aqui — e é assim que começa</h2>
        <p className="text-sm text-fg-muted mt-3">
          Um projeto é qualquer coisa com mais de um passo: uma viagem, uma disciplina, uma reforma. Dê um nome,
          liste as tarefas e o percentual passa a se atualizar sozinho conforme você conclui cada uma.
        </p>
        <button type="button" onClick={onCreate} className="btn btn-primary btn-lg mt-7">
          <IconPlus size={16} />
          Criar o primeiro projeto
        </button>
      </div>
    </div>
  );
}
