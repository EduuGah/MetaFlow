import { getDeadlineInfo } from './deadline';

interface ProjectLike {
  title: string;
  deadline: string | null;
}

export interface DeadlineAlert {
  title: string;
  body: string;
  /** Marca do dia: o navegador substitui um aviso de mesma tag em vez de empilhar. */
  tag: string;
}

/** Chave do dia em horário local — a mesma base do cálculo de prazo. */
function dayKey(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/**
 * Monta o aviso de prazos, ou `null` quando não há o que dizer.
 *
 * Um aviso por vez, nunca um por projeto: cinco notificações em fila viram
 * ruído e o usuário desliga tudo. Só atraso e vencimento de hoje entram —
 * "faltam 5 dias" não é motivo para interromper ninguém.
 */
export function buildDeadlineAlert(projects: ProjectLike[], now = new Date()): DeadlineAlert | null {
  const overdue: string[] = [];
  const today: string[] = [];

  for (const project of projects) {
    const { status } = getDeadlineInfo(project.deadline, now);
    if (status === 'overdue') overdue.push(project.title);
    else if (status === 'today') today.push(project.title);
  }

  if (overdue.length === 0 && today.length === 0) return null;

  const parts: string[] = [];
  if (overdue.length > 0) {
    parts.push(overdue.length === 1 ? '1 projeto atrasado' : `${overdue.length} projetos atrasados`);
  }
  if (today.length > 0) {
    parts.push(today.length === 1 ? '1 vence hoje' : `${today.length} vencem hoje`);
  }

  // Atrasados primeiro: é a informação que muda o que fazer agora.
  const names = [...overdue, ...today];
  const body = names.length <= 3 ? names.join(' · ') : `${names.slice(0, 3).join(' · ')} e mais ${names.length - 3}`;

  return { title: parts.join(' · '), body, tag: `metaflow-prazos-${dayKey(now)}` };
}

const SEEN_KEY = 'metaflow:aviso-prazos-em';

/**
 * Um aviso por dia, no máximo.
 *
 * Sem isto, cada volta ao painel dispararia a mesma notificação — e o painel
 * é justamente a tela para onde o app sempre volta.
 */
export function markAlertShown(now = new Date()): boolean {
  try {
    const key = dayKey(now);
    if (localStorage.getItem(SEEN_KEY) === key) return false;
    localStorage.setItem(SEEN_KEY, key);
    return true;
  } catch {
    // Sem storage não há como contar os avisos: melhor calar do que repetir.
    return false;
  }
}
