import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

interface EditProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onProjectUpdated: () => void;
}

export default function EditProjectModal({
  isOpen,
  project,
  onClose,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setDeadline(project.deadline || '');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('projects')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
      })
      .eq('id', project.id);

    setLoading(false);

    if (!error) {
      onProjectUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md p-6 shadow-md">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Editar Projeto</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Prazo Final</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Salvar...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}