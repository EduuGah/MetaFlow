import { useEffect, useId, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import { useToast } from '../context/ToastContext';
import { reportError, userMessage } from '../lib/logger';
import Modal, { ModalActions } from './Modal';
import { DEFAULT_CATEGORIES } from '../lib/categories';

/**
 * Criar e editar projeto compartilham o mesmo formulário.
 *
 * Antes eram dois arquivos com os mesmos quatro campos, a mesma validação e a
 * mesma chamada — copiados um do outro. Qualquer correção precisava ser feita
 * duas vezes, e uma delas sempre ficava para trás.
 */

const NEW_CATEGORY = '__new__';
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 500;

interface ProjectFormModalProps {
  open: boolean;
  /** Ausente = criação. Presente = edição. */
  project?: Project | null;
  userId: string;
  categories?: string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ProjectFormModal({
  open,
  project = null,
  userId,
  categories = DEFAULT_CATEGORIES,
  onClose,
  onSaved,
}: ProjectFormModalProps) {
  const { showToast } = useToast();
  const isEdit = Boolean(project);
  const fieldId = useId();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Só recarrega o formulário quando muda o projeto que está sendo editado ou
  // quando o diálogo reabre. Depender da lista de categorias aqui fazia o
  // efeito rodar de novo a cada render e apagar o que estava sendo digitado.
  useEffect(() => {
    if (!open) return;

    if (project) {
      setTitle(project.title);
      setDescription(project.description ?? '');
      const current = project.category || DEFAULT_CATEGORIES[0];
      const known = categories.includes(current);
      setCategory(known ? current : NEW_CATEGORY);
      setCustomCategory(known ? '' : current);
      setDeadline(project.deadline ?? '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setCustomCategory('');
      setDeadline('');
    }
    setTitleError(null);
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return; // trava de envio duplicado por Enter repetido

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError('Dê um nome ao projeto para conseguir encontrá-lo depois.');
      return;
    }

    const finalCategory =
      category === NEW_CATEGORY ? customCategory.trim() || DEFAULT_CATEGORIES[0] : category;

    const payload = {
      title: cleanTitle.slice(0, MAX_TITLE),
      description: description.trim().slice(0, MAX_DESCRIPTION) || null,
      category: finalCategory.slice(0, 40),
      deadline: deadline || null,
    };

    setBusy(true);

    const { error } = project
      ? await supabase.from('projects').update(payload).eq('id', project.id)
      : await supabase.from('projects').insert({ ...payload, user_id: userId });

    setBusy(false);

    if (error) {
      reportError(isEdit ? 'project.update' : 'project.insert', error, { projectId: project?.id });
      showToast(userMessage(isEdit ? 'Não foi possível salvar as alterações.' : 'Não foi possível criar o projeto.', error), 'error');
      return;
    }

    // O aviso de sucesso sai daqui e só daqui — quando a página que chamou
    // também avisava, o usuário via a mesma frase duas vezes.
    showToast(isEdit ? 'Projeto atualizado.' : 'Projeto criado.', 'success');
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar projeto' : 'Novo projeto'}
      description={isEdit ? undefined : 'Só o nome é obrigatório. O resto dá para ajustar depois.'}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor={`${fieldId}-title`} className="field-label">
            Nome do projeto
          </label>
          <input
            id={`${fieldId}-title`}
            data-autofocus
            type="text"
            value={title}
            maxLength={MAX_TITLE}
            autoComplete="off"
            enterKeyHint="done"
            aria-invalid={titleError ? 'true' : undefined}
            aria-describedby={titleError ? `${fieldId}-title-error` : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="Reforma da cozinha"
            className="field"
          />
          {titleError && (
            <p id={`${fieldId}-title-error`} className="text-xs text-alert mt-1.5">
              {titleError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${fieldId}-category`} className="field-label">
            Área
          </label>
          <select
            id={`${fieldId}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="field"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>Criar uma nova área…</option>
          </select>

          {category === NEW_CATEGORY && (
            <input
              type="text"
              value={customCategory}
              maxLength={40}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Nome da nova área"
              aria-label="Nome da nova área"
              className="field mt-2"
            />
          )}
        </div>

        <div>
          <label htmlFor={`${fieldId}-description`} className="field-label">
            Descrição <span className="text-fg-soft font-normal">(opcional)</span>
          </label>
          <textarea
            id={`${fieldId}-description`}
            rows={3}
            value={description}
            maxLength={MAX_DESCRIPTION}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que precisa estar pronto para considerar este projeto concluído?"
            className="field resize-y"
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-deadline`} className="field-label">
            Prazo final <span className="text-fg-soft font-normal">(opcional)</span>
          </label>
          <input
            id={`${fieldId}-deadline`}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="field"
          />
          <p className="text-xs text-fg-soft mt-1.5">
            Com um prazo definido, o projeto entra nos filtros de atrasado e a vencer.
          </p>
        </div>

        <ModalActions>
          <button type="button" onClick={onClose} className="btn btn-quiet btn-lg">
            Cancelar
          </button>
          <button type="submit" disabled={busy} data-busy={busy || undefined} className="btn btn-primary btn-lg">
            {isEdit ? 'Salvar alterações' : 'Criar projeto'}
          </button>
        </ModalActions>
      </form>
    </Modal>
  );
}
