import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  existingCategories?: string[];
  onClose: () => void;
  onProjectCreated: () => void;
  userId: string;
}

const DEFAULT_CATEGORIES = ['Geral', 'Trabalho', 'Estudos', 'Saúde', 'Pessoal', 'Projetos'];

export default function CreateProjectModal({
  isOpen,
  existingCategories = DEFAULT_CATEGORIES,
  onClose,
  onProjectCreated,
  userId,
}: CreateProjectModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySelect, setCategorySelect] = useState('Geral');
  const [customCategory, setCustomCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = categorySelect === '__new__' 
      ? customCategory.trim() || 'Geral' 
      : categorySelect;

    setLoading(true);

    const { error } = await supabase.from('projects').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      category: finalCategory,
      deadline: deadline || null,
    });

    setLoading(false);

    if (!error) {
      showToast('Projeto criado com sucesso!', 'success');
      setTitle('');
      setDescription('');
      setCategorySelect('Geral');
      setCustomCategory('');
      setDeadline('');
      onProjectCreated();
      onClose();
    } else {
      showToast('Erro ao criar projeto.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md p-6 shadow-md">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Novo Projeto</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
            <input
              type="text"
              required
              placeholder="Ex: Treino & Nutrição, Faculdade, PWA App..."
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição (opcional)</label>
            <textarea
              rows={3}
              placeholder="Resumo dos objetivos deste projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Prazo Final (opcional)</label>
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
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}