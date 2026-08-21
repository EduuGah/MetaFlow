import type { Project, Task } from '../types';
import ProgressDial from './ProgressDial';
import { computeProgress } from '../lib/progress';
import { cn } from '../lib/utils';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

/**
 * O agrupamento de leituras do painel.
 *
 * É um painel único dividido por fios, não quatro cartões flutuando lado a
 * lado: as quatro medidas descrevem o mesmo conjunto de tarefas, então
 * pertencem ao mesmo instrumento. Sem ícones decorativos e sem animação de
 * entrada — o dado aparece assim que existe.
 */
export default function DashboardStats({ projects }: { projects: ProjectWithTasks[] }) {
  const allTasks = projects.flatMap((p) => p.tasks ?? []);
  const { total, done, percent } = computeProgress(allTasks);
  const open = total - done;
  const urgent = allTasks.filter((t) => !t.is_completed && t.priority === 'high').length;

  return (
    <section aria-label="Resumo das tarefas" className="panel overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-edge">
        <div className="p-4 sm:p-5 flex items-center gap-3.5 col-span-2 lg:col-span-1">
          <ProgressDial value={percent} size={52} label="Progresso geral" tone={done === 0 ? 'signal' : 'flow'} />
          <div className="min-w-0">
            <p className="eyebrow">Progresso geral</p>
            <p className="text-sm text-fg-muted mt-1">
              <span className="font-mono text-fg">{done}</span> de{' '}
              <span className="font-mono">{total}</span> tarefas
            </p>
          </div>
        </div>

        <Reading label="Em aberto" value={open} note={open === 1 ? 'tarefa' : 'tarefas'} />
        <Reading label="Concluídas" value={done} note="no total" tone={done > 0 ? 'flow' : undefined} />
        <Reading
          label="Prioridade alta"
          value={urgent}
          note={urgent === 0 ? 'nada urgente' : urgent === 1 ? 'tarefa em aberto' : 'tarefas em aberto'}
          tone={urgent > 0 ? 'alert' : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}

function Reading({
  label,
  value,
  note,
  tone,
  className = '',
}: {
  label: string;
  value: number;
  note: string;
  tone?: 'flow' | 'alert';
  className?: string;
}) {
  const color = tone === 'alert' ? 'text-alert' : tone === 'flow' ? 'text-flow' : 'text-fg';
  return (
    <div className={cn('p-4 sm:p-5', className)}>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className={`font-mono font-medium text-2xl tabular ${color}`}>{value}</span>
        <span className="text-xs text-fg-soft">{note}</span>
      </p>
    </div>
  );
}
