import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import CreateProjectModal from '../components/CreateProjectModal';

interface ProjectWithTasks extends Project {
  tasks: Pick<Task, 'id' | 'is_completed'>[];
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(id, is_completed)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data as ProjectWithTasks[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProjects();
    });
  }, [fetchProjects]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteProject = async (projectId: string, title: string) => {
    if (!window.confirm(`Deseja realmente excluir o projeto "${title}"?`)) return;

    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      fetchProjects();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold">Painel de Metas</h1>
          {user && (
            <p className="text-xs text-slate-500">
              Conectado como: <span className="font-medium text-slate-700">{user.user_metadata?.full_name || user.email}</span>
            </p>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Sair
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Seus Projetos ({projects.length})</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            + Novo Projeto
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Carregando projetos...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
            Nenhum projeto encontrado. Clique em "+ Novo Projeto" para começar.
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => {
              const totalTasks = project.tasks?.length || 0;
              const completedTasks = project.tasks?.filter((t) => t.is_completed).length || 0;
              const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">{project.title}</h3>
                      {project.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/dashboard/${project.id}`}
                        className="text-xs text-slate-900 font-medium hover:underline whitespace-nowrap"
                      >
                        Ver detalhes →
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Excluir projeto"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Barra e status de progresso */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-800 h-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      {completedTasks}/{totalTasks} ({progressPercentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {user && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={fetchProjects}
          userId={user.id}
        />
      )}
    </div>
  );
}