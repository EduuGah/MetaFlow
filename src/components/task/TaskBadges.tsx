import { getDeadlineInfo } from '../../lib/deadline';
import { RECURRENCE_LABELS } from '../../lib/recurrence';
import { IconDeadline, IconRepeat } from '../Icon';

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

/**
 * Prazo da tarefa, com a mesma leitura do prazo de projeto.
 *
 * `getDeadlineInfo` é o único lugar que decide o que é atraso, o que vence
 * hoje e o que ainda dá tempo — reaproveitá-lo aqui garante que "Vence hoje"
 * significa a mesma coisa no painel e dentro do projeto. Tarefa concluída
 * perde a cor: um prazo vencido de algo que já foi feito é ruído vermelho.
 */
export function TaskDeadlineBadge({ deadline, done = false }: { deadline?: string | null; done?: boolean }) {
  const info = getDeadlineInfo(deadline);
  if (info.status === 'none') return null;

  const tone =
    done || info.tone === null
      ? undefined
      : info.tone === 'alert'
        ? { color: 'var(--c-alert)', borderColor: 'var(--c-alert)' }
        : info.tone === 'signal'
          ? { color: 'var(--c-signal)', borderColor: 'var(--c-signal)' }
          : { color: 'var(--c-flow)' };

  return (
    <span className={`chip chip-static text-2xs${done ? ' text-fg-soft' : ''}`} style={tone}>
      <IconDeadline size={11} />
      {info.label}
    </span>
  );
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
