import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { Project } from '../types';
import { supabase } from '../lib/supabase';
import CreateProjectModal from '../components/CreateProjectModal';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
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
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-xs"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{project.title}</h3>
                  {project.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
                  )}
                  {project.deadline && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <Link
                  to={`/dashboard/${project.id}`}
                  className="text-xs text-slate-900 font-medium hover:underline ml-4 whitespace-nowrap"
                >
                  Ver detalhes →
                </Link>
              </div>
            ))}
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