import { useEffect, useId, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { useToast } from '../context/ToastContext';
import { reportError, userMessage } from '../lib/logger';
import { RECURRENCE_OPTIONS } from '../lib/recurrence';
import Modal, { ModalActions } from './Modal';

interface EditTaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRIORITIES = [
  { value: 'low', label: 'Baixa — pode esperar' },
  { value: 'medium', label: 'Média — no fluxo normal' },
  { value: 'high', label: 'Alta — puxa a atenção do painel' },
] as const;

export default function EditTaskModal({ open, task, onClose, onSaved }: EditTaskModalProps) {
  const { showToast } = useToast();
  const fieldId = useId();
  const isSubtask = Boolean(task?.parent_id);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrence, setRecurrence] = useState('none');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setPriority(task.priority ?? 'medium');
    setRecurrence(task.recurrence ?? 'none');
    setNotes(task.notes ?? '');
    setError(null);
    setBusy(false);
  }, [open, task]);

  if (!task) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('O título não pode ficar vazio.');
      return;
    }

    const cleanNotes = notes.trim();

    setBusy(true);
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: cleanTitle.slice(0, 160),
        priority,
        // Subtarefa não repete: quem controla o ciclo é a tarefa principal.
        recurrence: isSubtask ? 'none' : recurrence,
        // Nota apagada volta a ser `null`, não string vazia: assim a lista
        // testa um só valor para decidir se mostra o bloco de anotação.
        notes: cleanNotes ? cleanNotes.slice(0, 2000) : null,
      })
      .eq('id', task.id);
    setBusy(false);

    if (updateError) {
      reportError('task.update', updateError, { taskId: task.id });
      showToast(userMessage('Não foi possível salvar a tarefa.', updateError), 'error');
      return;
    }

    showToast('Tarefa atualizada.', 'success');
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isSubtask ? 'Editar subtarefa' : 'Editar tarefa'} size="sm">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor={`${fieldId}-title`} className="field-label">
            Título
          </label>
          <input
            id={`${fieldId}-title`}
            data-autofocus
            type="text"
            value={title}
            maxLength={160}
            autoComplete="off"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            className="field"
          />
          {error && (
            <p id={`${fieldId}-error`} className="text-xs text-alert mt-1.5">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${fieldId}-priority`} className="field-label">
            Prioridade
          </label>
          <select
            id={`${fieldId}-priority`}
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="field"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${fieldId}-notes`} className="field-label">
            Notas <span className="text-fg-soft font-normal">(opcional)</span>
          </label>
          <textarea
            id={`${fieldId}-notes`}
            value={notes}
            rows={3}
            maxLength={2000}
            placeholder="Links, medidas, o que ficou combinado…"
            onChange={(e) => setNotes(e.target.value)}
            className="field resize-y min-h-[5rem]"
          />
        </div>

        {!isSubtask && (
          <div>
            <label htmlFor={`${fieldId}-recurrence`} className="field-label">
              Repetição
            </label>
            <select
              id={`${fieldId}-recurrence`}
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="field"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-fg-soft mt-1.5">
              Uma tarefa que repete volta para “a fazer” quando o intervalo vence, na próxima vez que você abrir
              o projeto.
            </p>
          </div>
        )}

        <ModalActions>
          <button type="button" onClick={onClose} className="btn btn-quiet btn-lg">
            Cancelar
          </button>
          <button type="submit" disabled={busy} data-busy={busy || undefined} className="btn btn-primary btn-lg">
            Salvar
          </button>
        </ModalActions>
      </form>
    </Modal>
  );
}
