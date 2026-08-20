import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';
import EditTaskModal from '../components/EditTaskModal';
import EditProjectModal from '../components/EditProjectModal';
import { Skeleton, TaskSkeleton } from '../components/Skeleton';
import {
  requestNotificationPermission,
  getNotificationPermissionState,
  sendNotification,
} from '../utils/notifications';

const RECURRENCE_LABELS: Record<string, string> = {
  '15m': 'A cada 15 min',
  '30m': 'A cada 30 min',
  '1h': 'A cada 1 hora',
  '6h': 'A cada 6 horas',
  '12h': 'A cada 12 horas',
  daily: 'Diária',
  weekly: 'Semanal',
};

const PRIORITY_STYLES: Record<string, { label: string; style: string }> = {
  high: { label: 'Alta', style: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Média', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Baixa', style: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Notificações
  const [notificationState, setNotificationState] = useState<string>(getNotificationPermissionState());

  // Form de Criação
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<string>('none');
  const [subtaskTitleMap, setSubtaskTitleMap] = useState<Record<string, string>>({});
  const [activeSubtaskInput, setActiveSubtaskInput] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const [taskError, setTaskError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationState(granted ? 'granted' : 'denied');
    if (granted) {
      sendNotification('MetaFlow Notificações Ativadas', {
        body: 'Você receberá avisos quando suas metas serem resetadas ou precisarem de atenção.',
      });
    }
  };

  const checkAndResetRecurrentTasks = useCallback(async (fetchedTasks: Task[]) => {
    const now = new Date();
    const tasksToReset: Task[] = [];

    fetchedTasks.forEach((task) => {
      if (!task.is_completed || !task.last_completed_at || !task.recurrence || task.recurrence === 'none') {
        return;
      }

      const completedDate = new Date(task.last_completed_at);
      const diffMinutes = (now.getTime() - completedDate.getTime()) / (1000 * 60);

      let shouldReset = false;

      switch (task.recurrence) {
        case '15m': shouldReset = diffMinutes >= 15; break;
        case '30m': shouldReset = diffMinutes >= 30; break;
        case '1h': shouldReset = diffMinutes >= 60; break;
        case '6h': shouldReset = diffMinutes >= 360; break;
        case '12h': shouldReset = diffMinutes >= 720; break;
        case 'daily': shouldReset = diffMinutes >= 1440; break;
        case 'weekly': shouldReset = diffMinutes >= 10080; break;
      }

      if (shouldReset) tasksToReset.push(task);
    });

    if (tasksToReset.length > 0) {
      const resetIds = tasksToReset.map((t) => t.id);

      await supabase
        .from('tasks')
        .update({ is_completed: false })
        .in('id', resetIds);

      // Disparar notificação nativa para cada tarefa zerada
      tasksToReset.forEach((t) => {
        sendNotification(`Meta Pronta: ${t.title}`, {
          body: `O ciclo desta tarefa foi renovado e ela está pronta para ser realizada novamente.`,
          tag: `reset-${t.id}`,
        });
      });

      return fetchedTasks.map((t) =>
        resetIds.includes(t.id) ? { ...t, is_completed: false } : t
      );
    }

    return fetchedTasks;
  }, []);

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [projectRes, tasksRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
    ]);

    if (!projectRes.error && projectRes.data) {
      setProject(projectRes.data);
    }

    if (!tasksRes.error && tasksRes.data) {
      const processedTasks = await checkAndResetRecurrentTasks(tasksRes.data as Task[]);
      setTasks(processedTasks);
    }

    setLoading(false);
  }, [id, checkAndResetRecurrentTasks]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleAddMainTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setTaskError('Informe o título da meta ou tarefa.');
      return;
    }
    if (!id) return;

    setTaskError(null);
    const { error } = await supabase.from('tasks').insert({
      project_id: id,
      title: newTaskTitle.trim(),
      is_completed: false,
      parent_id: null,
      priority: newTaskPriority,
      recurrence: newTaskRecurrence,
    });

    if (!error) {
      setNewTaskTitle('');
      setNewTaskPriority('medium');
      setNewTaskRecurrence('none');
      fetchProjectData();
    }
  };

  const handleAddSubtask = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = subtaskTitleMap[parentId]?.trim();
    if (!title) return;
    if (!id) return;

    const { error } = await supabase.from('tasks').insert({
      project_id: id,
      title,
      is_completed: false,
      parent_id: parentId,
      priority: 'medium',
      recurrence: 'none',
    });

    if (!error) {
      setSubtaskTitleMap((prev) => ({ ...prev, [parentId]: '' }));
      fetchProjectData();
    }
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = !task.is_completed;
    const nowIso = nextStatus ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_completed: nextStatus, last_completed_at: nowIso } : t
      )
    );

    const { error } = await supabase
      .from('tasks')
      .update({
        is_completed: nextStatus,
        last_completed_at: nowIso,
      })
      .eq('id', task.id);

    if (error) {
      fetchProjectData();
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const targetId = taskToDelete.id;

    setTasks((prev) => prev.filter((t) => t.id !== targetId && t.parent_id !== targetId));

    const { error } = await supabase.from('tasks').delete().eq('id', targetId);

    if (error) {
      fetchProjectData();
    }
    setTaskToDelete(null);
  };

  const filteredMainTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.parent_id) return false;

      const subtasks = tasks.filter((s) => s.parent_id === task.id);
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtasks.some((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'pending' && task.is_completed) return false;
      if (statusFilter === 'completed' && !task.is_completed) return false;

      if (priorityFilter !== 'all' && (task.priority || 'medium') !== priorityFilter) return false;

      return true;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-4 w-28" />
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <Skeleton className="h-7 w-1/2" />
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-center text-slate-600">
        <p className="text-sm">Projeto não encontrado.</p>
        <Link to="/dashboard" className="text-xs text-slate-900 underline mt-2 inline-block">
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-800">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link to="/dashboard" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors inline-block py-1">
          ← Voltar ao Dashboard
        </Link>

        {/* Banner de Solicitação de Notificações */}
        {notificationState === 'default' && (
          <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="text-xs space-y-0.5">
              <p className="font-semibold">Ativar Notificações do MetaFlow</p>
              <p className="text-slate-300">Receba avisos nativos no celular ou PC quando suas tarefas forem zeradas.</p>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="px-3 py-1.5 text-xs font-medium bg-white text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              Ativar
            </button>
          </div>
        )}

        {/* Card do Projeto */}
        <div className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{project.title}</h1>
              {project.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{project.description}</p>
              )}
            </div>
            <button
              onClick={() => setIsEditProjectOpen(true)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-md transition-colors cursor-pointer shrink-0"
            >
              Editar Projeto
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Progresso Geral</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-slate-900 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form de Nova Meta */}
        <div className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Tarefas & Metas</h2>

          <div>
            <form onSubmit={handleAddMainTask} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Adicionar nova meta..."
                value={newTaskTitle}
                onChange={(e) => {
                  setNewTaskTitle(e.target.value);
                  if (taskError) setTaskError(null);
                }}
                className={`flex-1 px-3.5 py-2.5 text-sm border rounded-md focus:outline-none transition-colors ${
                  taskError ? 'border-red-400 focus:border-red-600' : 'border-slate-300 focus:border-slate-800'
                }`}
              />

              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="px-3 py-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800 bg-white text-slate-700"
              >
                <option value="low">Baixa Pri.</option>
                <option value="medium">Média Pri.</option>
                <option value="high">Alta Pri.</option>
              </select>

              <select
                value={newTaskRecurrence}
                onChange={(e) => setNewTaskRecurrence(e.target.value)}
                className="px-3 py-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800 bg-white text-slate-700"
              >
                <option value="none">Única</option>
                <option value="15m">A cada 15 min</option>
                <option value="30m">A cada 30 min</option>
                <option value="1h">A cada 1 hora</option>
                <option value="6h">A cada 6 horas</option>
                <option value="12h">A cada 12 horas</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer active:scale-98 whitespace-nowrap"
              >
                Criar Meta
              </button>
            </form>
            {taskError && <p className="text-[11px] text-red-600 mt-1.5 font-medium">{taskError}</p>}
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            <input
              type="text"
              placeholder="Buscar meta ou etapa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-800"
            />

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="all">Status: Todos</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídas</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="all">Prioridade: Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>

          {/* Lista de Metas */}
          <div className="space-y-3 pt-1">
            {filteredMainTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Nenhum resultado encontrado para os filtros selecionados.'
                  : 'Nenhuma meta cadastrada ainda.'}
              </p>
            ) : (
              filteredMainTasks.map((mainTask) => {
                const subtasks = tasks.filter((t) => t.parent_id === mainTask.id);
                const subtasksCompleted = subtasks.filter((s) => s.is_completed).length;
                const priorityInfo = PRIORITY_STYLES[mainTask.priority || 'medium'];

                return (
                  <div key={mainTask.id} className="border border-slate-200 rounded-lg p-3.5 space-y-3 bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={mainTask.is_completed}
                          onChange={() => handleToggleTask(mainTask)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-sm font-semibold truncate ${
                                mainTask.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {mainTask.title}
                            </span>

                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityInfo.style} whitespace-nowrap`}>
                              {priorityInfo.label}
                            </span>

                            {mainTask.recurrence && mainTask.recurrence !== 'none' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 whitespace-nowrap">
                                {RECURRENCE_LABELS[mainTask.recurrence] || mainTask.recurrence}
                              </span>
                            )}
                          </div>

                          {subtasks.length > 0 && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Etapas: {subtasksCompleted}/{subtasks.length} concluídas
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSubtaskInput(activeSubtaskInput === mainTask.id ? null : mainTask.id)
                          }
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          + Subtarefa
                        </button>

                        <button
                          type="button"
                          onClick={() => setTaskToEdit(mainTask)}
                          className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer shrink-0"
                          title="Editar meta"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTaskToDelete({ id: mainTask.id, title: mainTask.title })}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                          title="Excluir meta"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {activeSubtaskInput === mainTask.id && (
                      <form
                        onSubmit={(e) => handleAddSubtask(mainTask.id, e)}
                        className="flex gap-2 pl-7 pt-1"
                      >
                        <input
                          type="text"
                          placeholder="Adicionar subtarefa..."
                          value={subtaskTitleMap[mainTask.id] || ''}
                          onChange={(e) =>
                            setSubtaskTitleMap((prev) => ({ ...prev, [mainTask.id]: e.target.value }))
                          }
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded-md hover:bg-slate-700 cursor-pointer"
                        >
                          Salvar
                        </button>
                      </form>
                    )}

                    {subtasks.length > 0 && (
                      <div className="pl-7 space-y-1.5 border-l-2 border-slate-100 ml-2 pt-1">
                        {subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={subtask.is_completed}
                                onChange={() => handleToggleTask(subtask)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                              />
                              <span
                                className={`text-xs ${
                                  subtask.is_completed ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}
                              >
                                {subtask.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setTaskToEdit(subtask)}
                                className="text-slate-300 hover:text-slate-700 p-1 cursor-pointer"
                                title="Editar subtarefa"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTaskToDelete({ id: subtask.id, title: subtask.title })}
                                className="text-slate-300 hover:text-red-600 p-1 cursor-pointer"
                                title="Excluir subtarefa"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <EditProjectModal
        isOpen={isEditProjectOpen}
        project={project}
        onClose={() => setIsEditProjectOpen(false)}
        onProjectUpdated={fetchProjectData}
      />

      <EditTaskModal
        isOpen={!!taskToEdit}
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onTaskUpdated={fetchProjectData}
      />

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Excluir Item"
        message={`Deseja realmente remover "${taskToDelete?.title}"?`}
        confirmText="Excluir"
        isDestructive={true}
        onConfirm={confirmDeleteTask}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}