import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

interface EditProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  existingCategories?: string[];
  onClose: () => void;
  onProjectUpdated: () => void;
}

const DEFAULT_CATEGORIES = ['Geral', 'Trabalho', 'Estudos', 'Saúde', 'Pessoal', 'Projetos'];

export default function EditProjectModal({
  isOpen,
  project,
  existingCategories = DEFAULT_CATEGORIES,
  onClose,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySelect, setCategorySelect] = useState('Geral');
  const [customCategory, setCustomCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      const cat = project.category || 'Geral';
      if (existingCategories.includes(cat)) {
        setCategorySelect(cat);
        setCustomCategory('');
      } else {
        setCategorySelect('__new__');
        setCustomCategory(cat);
      }
      setDeadline(project.deadline || '');
    }
  }, [project, existingCategories]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = categorySelect === '__new__'
      ? customCategory.trim() || 'Geral'
      : categorySelect;

    setLoading(true);

    const { error } = await supabase
      .from('projects')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        category: finalCategory,
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
            <select
              value={categorySelect}
              onChange={(e) => setCategorySelect(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800 bg-white text-slate-700 mb-2"
            >
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__new__">+ Criar nova categoria...</option>
            </select>

            {categorySelect === '__new__' && (
              <input
                type="text"
                required
                placeholder="Nome da nova categoria..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
              />
            )}
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