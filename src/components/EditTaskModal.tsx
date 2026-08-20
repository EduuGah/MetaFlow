import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { useToast } from '../context/ToastContext';

interface EditTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export default function EditTaskModal({
  isOpen,
  task,
  onClose,
  onTaskUpdated,
}: EditTaskModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrence, setRecurrence] = useState<string>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority || 'medium');
      setRecurrence(task.recurrence || 'none');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        priority,
        recurrence: task.parent_id ? 'none' : recurrence,
      })
      .eq('id', task.id);

    setLoading(false);

    if (!error) {
      showToast('Tarefa atualizada com sucesso!', 'success');
      onTaskUpdated();
      onClose();
    } else {
      showToast('Erro ao atualizar tarefa.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-slate-200 w-full max-w-sm p-5 shadow-md">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Editar Item</h3>

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
            <label className="block text-xs font-medium text-slate-700 mb-1">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800 bg-white text-slate-700"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          {!task.parent_id && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Recorrência</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-slate-800 bg-white text-slate-700"
              >
                <option value="none">Sem repetição (Única)</option>
                <option value="15m">A cada 15 minutos</option>
                <option value="30m">A cada 30 minutos</option>
                <option value="1h">A cada 1 hora</option>
                <option value="6h">A cada 6 horas</option>
                <option value="12h">A cada 12 horas</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Salvar...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}