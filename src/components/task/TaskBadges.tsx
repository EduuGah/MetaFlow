import { RECURRENCE_LABELS } from '../../lib/recurrence';
import { IconRepeat } from '../Icon';

/**
 * Três níveis, três pesos visuais.
 *
 * Alta puxa a atenção com coral, média fica no tom de texto normal e baixa
 * some para o cinza mais apagado. Nenhuma prioridade fica sem selo: quem
 * define "média" na criação precisa ver que a escolha foi registrada — antes
 * o selo sumia e parecia que o campo não tinha sido salvo.
 */
export function PriorityBadge({ priority, quiet = false }: { priority?: string | null; quiet?: boolean }) {
  if (priority === 'high') {
    return (
      <span
        className="chip chip-static text-2xs"
        style={{ color: 'var(--c-alert)', borderColor: 'var(--c-alert)' }}
      >
        Alta
      </span>
    );
  }
  if (priority === 'low') {
    return <span className="chip chip-static text-2xs text-fg-soft">Baixa</span>;
  }
  // Nas linhas aninhadas o padrão fica calado: em três níveis de recuo, um
  // selo "Média" repetido em cada etapa rouba a largura do próprio título.
  // Alta e baixa continuam aparecendo em qualquer nível — são exceção.
  if (quiet) return null;

  // Sem prioridade gravada, a tarefa é média — é o padrão do formulário.
  return <span className="chip chip-static text-2xs">Média</span>;
}

export function RecurrenceBadge({ recurrence }: { recurrence?: string | null }) {
  if (!recurrence || recurrence === 'none') return null;
  const label = RECURRENCE_LABELS[recurrence] ?? recurrence;
  return (
    <span className="chip chip-static text-2xs" title={`Repete ${label}`}>
      <IconRepeat size={11} />
      {label}
    </span>
  );
}
