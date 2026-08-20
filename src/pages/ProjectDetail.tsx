import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';
import { Skeleton, TaskSkeleton } from '../components/Skeleton';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);

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
      setTasks(tasksRes.data);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;

    const { error } = await supabase.from('tasks').insert({
      project_id: id,
      title: newTaskTitle.trim(),
      is_completed: false,
    });

    if (!error) {
      setNewTaskTitle('');
      fetchProjectData();
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_completed: !currentStatus } : t))
    );

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);

    if (error) {
      fetchProjectData();
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const targetId = taskToDelete.id;

    setTasks((prev) => prev.filter((t) => t.id !== targetId));

    const { error } = await supabase.from('tasks').delete().eq('id', targetId);

    if (error) {
      fetchProjectData();
    }
    setTaskToDelete(null);
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-3 w-28" />

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <Skeleton className="h-4 w-32 mb-4" />
            <TaskSkeleton />
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
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-block">
          ← Voltar ao Dashboard
        </Link>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-slate-600 mt-2">{project.description}</p>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
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

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Tarefas & Checklist</h2>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Adicionar nova etapa..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Adicionar
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma tarefa criada ainda.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.is_completed)}
                  className="group flex items-center justify-between p-3 rounded-md hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                    />
                    <span
                      className={`text-sm ${
                        task.is_completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete({ id: task.id, title: task.title });
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-2 py-1"
                    title="Excluir tarefa"
                  >
                    Excluir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Excluir Tarefa"
        message={`Deseja realmente remover a tarefa "${taskToDelete?.title}"?`}
        confirmText="Excluir"
        isDestructive={true}
        onConfirm={confirmDeleteTask}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}