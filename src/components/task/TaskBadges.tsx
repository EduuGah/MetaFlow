import { RECURRENCE_LABELS } from '../../lib/recurrence';
import { IconRepeat } from '../Icon';

/**
 * Só a exceção ganha marcação.
 *
 * Prioridade média é o padrão e não recebe selo — se toda tarefa tivesse um,
 * a cor deixaria de significar alguma coisa e a lista viraria um mosaico.
 * Alta puxa a atenção, baixa avisa que pode esperar, o resto fica quieto.
 */
export function PriorityBadge({ priority }: { priority?: string | null }) {
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
  return null;
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
