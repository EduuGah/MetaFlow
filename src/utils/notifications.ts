// Extensão para suportar propriedades de Service Worker / Mobile Notification no TypeScript
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  badge?: string;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function sendNotification(title: string, options?: ExtendedNotificationOptions) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions: ExtendedNotificationOptions = {
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    ...options,
  };

  // Se houver um Service Worker ativo (PWA no celular/desktop), dispara via Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, defaultOptions as NotificationOptions);
      return;
    } catch {
      // Fallback para Notification tradicional
    }
  }

  // Fallback para Notification tradicional
  try {
    new Notification(title, defaultOptions as NotificationOptions);
  } catch (err) {
    console.error('Erro ao enviar notificação:', err);
  }
}