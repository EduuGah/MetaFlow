import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import CreateProjectModal from '../components/CreateProjectModal';
import EditProjectModal from '../components/EditProjectModal';
import ConfirmModal from '../components/ConfirmModal';
import DashboardStats from '../components/DashboardStats';
import { ProjectCardSkeleton } from '../components/Skeleton';

const DEFAULT_CATEGORIES = ['Geral', 'Trabalho', 'Estudos', 'Saúde', 'Pessoal', 'Projetos'];

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(*)')
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

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const targetId = projectToDelete.id;

    setProjects((prev) => prev.filter((p) => p.id !== targetId));

    const { error } = await supabase.from('projects').delete().eq('id', targetId);

    if (error) {
      fetchProjects();
    }
    setProjectToDelete(null);
  };

  const existingCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  const filterChips = useMemo(() => ['Todas', ...existingCategories], [existingCategories]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'Todas') return projects;
    return projects.filter((p) => (p.category || 'Geral') === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-800">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Painel de Metas</h1>
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
        {!loading && projects.length > 0 && (
          <DashboardStats projects={projects} />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h2 className="text-sm font-semibold text-slate-700">Seus Projetos ({filteredProjects.length})</h2>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
          >
            + Novo Projeto
          </button>
        </div>

        {!loading && projects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {filterChips.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-3">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
            {selectedCategory !== 'Todas'
              ? `Nenhum projeto encontrado na categoria "${selectedCategory}".`
              : 'Nenhum projeto encontrado. Clique em "+ Novo Projeto" para começar.'}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProjects.map((project) => {
              const totalTasks = project.tasks?.length || 0;
              const completedTasks = project.tasks?.filter((t) => t.is_completed).length || 0;
              const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-800 truncate">{project.title}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {project.category || 'Geral'}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{project.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/dashboard/${project.id}`}
                        className="text-xs text-slate-900 font-medium hover:underline whitespace-nowrap"
                      >
                        Ver detalhes →
                      </Link>
                      <button
                        onClick={() => setProjectToEdit(project)}
                        className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer px-1.5 py-0.5"
                        title="Editar projeto"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setProjectToDelete({ id: project.id, title: project.title })}
                        className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer px-1 py-0.5"
                        title="Excluir projeto"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

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
          isOpen={isCreateModalOpen}
          existingCategories={existingCategories}
          onClose={() => setIsCreateModalOpen(false)}
          onProjectCreated={fetchProjects}
          userId={user.id}
        />
      )}

      <EditProjectModal
        isOpen={!!projectToEdit}
        project={projectToEdit}
        existingCategories={existingCategories}
        onClose={() => setProjectToEdit(null)}
        onProjectUpdated={fetchProjects}
      />

      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Excluir Projeto"
        message={`Tem certeza que deseja excluir "${projectToDelete?.title}"? Esta ação removerá o projeto e todas as suas tarefas permanentemente.`}
        confirmText="Excluir"
        isDestructive={true}
        onConfirm={confirmDeleteProject}
        onClose={() => setProjectToDelete(null)}
      />
    </div>
  );
}