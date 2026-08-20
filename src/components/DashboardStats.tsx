import type { Project, Task } from '../types';

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

interface DashboardStatsProps {
  projects: ProjectWithTasks[];
}

export default function DashboardStats({ projects }: DashboardStatsProps) {
  const allTasks = projects.flatMap((p) => p.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityPending = allTasks.filter((t) => !t.is_completed && t.priority === 'high').length;

  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Progresso Geral</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-slate-900">{globalProgress}%</span>
          <span className="text-xs text-slate-400">concluído</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Tarefas Pendentes</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-slate-800">{pendingTasks}</span>
          <span className="text-xs text-slate-400">de {totalTasks}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Concluídas</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-emerald-600">{completedTasks}</span>
          <span className="text-xs text-slate-400">etapas</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Alta Prioridade</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl font-bold ${highPriorityPending > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {highPriorityPending}
          </span>
          <span className="text-xs text-slate-400">urgentes</span>
        </div>
      </div>
    </div>
  );
}