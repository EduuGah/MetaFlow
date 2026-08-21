import { useEffect, useId, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { reportError, userMessage } from '../lib/logger';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { MAX_IMPORT_TASKS, parseMarkdownProject, type ParsedTask } from '../lib/markdownImport';
import Modal, { ModalActions } from './Modal';

interface ImportProjectModalProps {
  open: boolean;
  userId: string;
  categories?: string[];
  onClose: () => void;
  onSaved: () => void;
}

const MAX_TITLE = 120;
const MAX_NOTES = 2000;

/** Linhas por requisição. 500 mantém o corpo bem abaixo de qualquer limite. */
const INSERT_BATCH = 500;

/** Uma linha da tabela `tasks`, montada antes de qualquer ida ao banco. */
interface TaskRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  is_completed: boolean;
  status: 'todo' | 'done';
  priority: 'medium';
  recurrence: 'none';
  notes: string | null;
  position: number;
}

/**
 * Achata a árvore em linhas, pai sempre antes dos seus filhos.
 *
 * Os ids são gerados aqui, no navegador, e não pelo banco. É o que permite
 * preencher `parent_id` antes de gravar: esperar o banco devolver o id de cada
 * linha significaria uma ida de rede por tarefa — milhares, num documento
 * grande. O Postgres só confere a chave estrangeira no fim do INSERT, então
 * pai e filho podem viajar no mesmo lote.
 *
 * A ordem de emissão é contrato com quem grava: ver o laço de lotes abaixo.
 */
function flatten(tasks: ParsedTask[], projectId: string, parentId: string | null = null): TaskRow[] {
  return tasks.flatMap((task, index) => {
    const id = uuid();
    const row: TaskRow = {
      id,
      project_id: projectId,
      parent_id: parentId,
      title: task.title,
      is_completed: task.done,
      status: task.done ? 'done' : 'todo',
      priority: 'medium',
      recurrence: 'none',
      notes: task.notes.length > 0 ? task.notes.join('\n').slice(0, MAX_NOTES) : null,
      position: index,
    };
    return [row, ...flatten(task.children, projectId, id)];
  });
}

/**
 * Desenha a árvore como texto recuado, para a pessoa conferir antes de gravar.
 * A chave é o caminho na árvore ("0.2.1"): estável entre renders, ao contrário
 * de um número sorteado, que remontaria a lista inteira a cada tecla digitada.
 */
function outline(
  tasks: ParsedTask[],
  depth = 0,
  prefix = ''
): { key: string; text: string; depth: number; done: boolean }[] {
  return tasks.flatMap((task, index) => {
    const key = `${prefix}${index}`;
    return [
      { key, text: task.title, depth, done: task.done },
      ...outline(task.children, depth + 1, `${key}.`),
    ];
  });
}

/**
 * `crypto.randomUUID` só existe em contexto seguro e em navegador recente.
 * Sem a reserva, um Safari antigo derrubaria a importação inteira em vez de
 * degradar — e o erro apareceria como "falhou", sem pista do motivo.
 */
function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Importar um projeto colando markdown.
 *
 * Existe porque transcrever à mão um plano de cem linhas gerado numa conversa
 * é justamente o trabalho que o app deveria evitar. O formato lido é o que
 * esses documentos já têm: títulos com `#`, itens com `-` ou `*`, caixas
 * `[ ]` e `[x]`. Nada de campo novo para a pessoa preencher.
 *
 * A pré-visualização não é enfeite: a importação cria dezenas de linhas de uma
 * vez, e desfazer isso na mão seria pior do que digitar. Ver antes é o que
 * torna o botão seguro de apertar.
 */
export default function ImportProjectModal({
  open,
  userId,
  categories = DEFAULT_CATEGORIES,
  onClose,
  onSaved,
}: ImportProjectModalProps) {
  const { showToast } = useToast();
  const fieldId = useId();

  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMarkdown('');
    setTitle('');
    // A lista de áreas do painel sempre começa pelas padrão, então 'Geral'
    // existe no seletor. Depender de `categories` aqui faria o efeito rodar a
    // cada render e limpar o campo enquanto a pessoa digita.
    setCategory(DEFAULT_CATEGORIES[0]);
    setBusy(false);
  }, [open]);

  const plan = useMemo(() => parseMarkdownProject(markdown), [markdown]);

  // O nome do documento entra como sugestão; o campo continua sendo do usuário.
  const effectiveTitle = title.trim() || plan.title || '';
  const preview = useMemo(() => outline(plan.tasks).slice(0, 60), [plan.tasks]);
  const canImport = plan.total > 0 && Boolean(effectiveTitle) && !busy;

  const handleImport = async () => {
    if (!canImport) return;
    setBusy(true);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: effectiveTitle.slice(0, MAX_TITLE),
        description: null,
        category: category.slice(0, 40),
        deadline: null,
      })
      .select()
      .single();

    if (error || !data) {
      setBusy(false);
      reportError('project.import', error);
      showToast(userMessage('Não foi possível criar o projeto.', error), 'error');
      return;
    }

    const rows = flatten(plan.tasks, data.id as string);

    /*
     * Em lotes, e em ordem.
     *
     * Uma requisição só com milhares de linhas passa de alguns megabytes e
     * bate no limite de tamanho do servidor — o que não é "demorado", é
     * "falhou". Fatiar troca uma falha dura por vários segundos de espera.
     *
     * A ordem entre os lotes não pode mudar: `flatten` emite o pai antes dos
     * filhos, então o pai sempre cai num lote anterior ou no mesmo, e a chave
     * estrangeira nunca aponta para uma linha que ainda não existe. Por isso
     * os lotes vão em sequência, e não em paralelo.
     */
    for (let start = 0; start < rows.length; start += INSERT_BATCH) {
      const batch = rows.slice(start, start + INSERT_BATCH);
      const { error: tasksError } = await supabase.from('tasks').insert(batch);

      if (tasksError) {
        setBusy(false);
        // O projeto fica criado, com o que já entrou. Apagar aqui poderia
        // levar junto algo que a pessoa já tivesse aberto noutra aba; dizer a
        // verdade e mandá-la para o projeto é mais honesto do que fingir.
        reportError('tasks.import', tasksError, { projectId: data.id, inserted: start, total: rows.length });
        showToast(
          userMessage(
            start === 0
              ? 'O projeto foi criado, mas as tarefas não entraram.'
              : `O projeto foi criado com as primeiras ${start} tarefas; o resto não entrou.`,
            tasksError
          ),
          'error'
        );
        onSaved();
        onClose();
        return;
      }
    }

    setBusy(false);
    showToast(`Projeto criado com ${rows.length} ${rows.length === 1 ? 'tarefa' : 'tarefas'}.`, 'success');
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar projeto"
      description="Cole um plano em markdown. Títulos viram tarefas; itens de lista viram etapas."
      size="lg"
    >
      <div className="space-y-5">
        <div>
          <label htmlFor={`${fieldId}-md`} className="field-label">
            Documento
          </label>
          <textarea
            id={`${fieldId}-md`}
            data-autofocus
            value={markdown}
            rows={8}
            placeholder={'# Meu projeto\n## Primeira parte\n* [ ] Primeiro passo\n* [x] Passo já feito'}
            onChange={(e) => setMarkdown(e.target.value)}
            className="field resize-y min-h-[9rem] font-mono text-xs"
          />
          <p className="text-xs text-fg-soft mt-1.5">
            Parágrafos, tabelas, citações e blocos de código são ignorados — num plano eles explicam, não são
            tarefa.
          </p>
        </div>

        {markdown.trim() && (
          <div className="animate-rise space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${fieldId}-title`} className="field-label">
                  Nome do projeto
                </label>
                <input
                  id={`${fieldId}-title`}
                  type="text"
                  value={title}
                  maxLength={MAX_TITLE}
                  placeholder={plan.title ?? 'Dê um nome'}
                  onChange={(e) => setTitle(e.target.value)}
                  className="field"
                />
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
                </select>
              </div>
            </div>

            <div>
              <p className="field-label">
                Prévia — {plan.total} {plan.total === 1 ? 'linha' : 'linhas'}
                {plan.done > 0 && `, ${plan.done} já concluída${plan.done === 1 ? '' : 's'}`}
              </p>

              {plan.total > 0 ? (
                <div
                  className="rounded-md border border-edge p-3 max-h-56 overflow-y-auto"
                  style={{ background: 'var(--c-raised)' }}
                >
                  {preview.map((line) => (
                    <p
                      key={line.key}
                      className={`text-xs leading-6 truncate ${line.done ? 'line-through text-fg-soft' : 'text-fg-muted'}`}
                      style={{ paddingLeft: `${line.depth * 1.1}rem` }}
                    >
                      <span className="text-fg-soft font-mono mr-1.5">{line.done ? '[x]' : '[ ]'}</span>
                      {line.text}
                    </p>
                  ))}
                  {plan.total > preview.length && (
                    <p className="text-xs text-fg-soft mt-2">e mais {plan.total - preview.length}…</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">Nada reconhecido ainda.</p>
              )}
            </div>

            {plan.warnings.length > 0 && (
              <ul className="space-y-1.5">
                {plan.warnings.map((warning) => (
                  <li key={warning} className="text-xs text-signal flex gap-2">
                    <span aria-hidden="true">·</span>
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ModalActions>
          <button type="button" onClick={onClose} className="btn btn-quiet btn-lg">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            data-busy={busy || undefined}
            className="btn btn-primary btn-lg"
          >
            {plan.total > 0 ? `Importar ${Math.min(plan.total, MAX_IMPORT_TASKS)}` : 'Importar'}
          </button>
        </ModalActions>
      </div>
    </Modal>
  );
}
