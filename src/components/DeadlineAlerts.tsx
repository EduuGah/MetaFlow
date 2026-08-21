import { useEffect, useState } from 'react';
import { buildDeadlineAlert, markAlertShown } from '../lib/deadlineAlerts';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  sendNotification,
} from '../utils/notifications';
import { useToast } from '../context/ToastContext';
import { IconClose, IconDeadline } from './Icon';

interface ProjectLike {
  title: string;
  deadline: string | null;
}

const DISMISS_KEY = 'metaflow:convite-avisos';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Avisos do sistema sobre prazo.
 *
 * O disparo acontece quando o painel carrega — não há servidor de push aqui,
 * então o MetaFlow só consegue falar enquanto está aberto. Numa instalação de
 * PWA isso ainda vale a pena: o aviso chega no momento em que a pessoa abre o
 * app e é justamente aí que ela decide o que fazer no dia.
 *
 * O convite só aparece uma vez e some para sempre ao ser recusado. Pedir
 * permissão de notificação sem contexto é o jeito mais rápido de ser negado
 * para sempre pelo navegador — por isso ele só surge quando existe prazo
 * cadastrado, ou seja, quando o aviso teria o que dizer.
 */
export default function DeadlineAlerts({ projects }: { projects: ProjectLike[] }) {
  const { showToast } = useToast();
  const [permission, setPermission] = useState(getNotificationPermissionState);
  const [dismissed, setDismissed] = useState(wasDismissed);

  useEffect(() => {
    if (permission !== 'granted') return;

    const alert = buildDeadlineAlert(projects);
    if (!alert) return;

    // A ordem importa: só marca o dia se houver aviso, senão um painel aberto
    // de manhã sem nada vencendo gastaria a única chance do dia.
    if (!markAlertShown()) return;

    void sendNotification(alert.title, { body: alert.body, tag: alert.tag });
  }, [permission, projects]);

  const hide = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sem storage o convite volta na próxima visita — irritante, não quebrado */
    }
  };

  const enable = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermissionState());

    if (granted) {
      showToast('Avisos de prazo ativados.', 'success');
    } else {
      showToast('O navegador não liberou os avisos.', 'info');
      hide();
    }
  };

  const hasDeadlines = projects.some((p) => Boolean(p.deadline));
  if (permission !== 'default' || dismissed || !hasDeadlines) return null;

  return (
    <div className="panel px-4 py-3 flex items-center gap-3">
      <span className="text-signal shrink-0" aria-hidden="true">
        <IconDeadline size={18} />
      </span>

      <p className="text-sm text-fg-muted flex-1 min-w-0">
        Quer um aviso do sistema quando um projeto vencer ou atrasar? Ele aparece assim que você abre o MetaFlow.
      </p>

      <button type="button" onClick={enable} className="btn btn-secondary btn-sm shrink-0">
        Ativar avisos
      </button>
      <button type="button" onClick={hide} className="btn-icon h-8 w-8 shrink-0" aria-label="Dispensar o convite de avisos">
        <IconClose size={14} />
      </button>
    </div>
  );
}
