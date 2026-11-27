import { Notification, Notifier } from '../notifications/notifier.port';

export class FakeNotifier implements Notifier {
  readonly notifications: Notification[] = [];
  readonly dismissedKeys: string[] = [];

  show(n: Notification): void {
    this.notifications.push(n);
  }

  success(messageKey: string, params?: Record<string, unknown>): void {
    this.show({ level: 'success', messageKey, params });
  }

  info(messageKey: string, params?: Record<string, unknown>): void {
    this.show({ level: 'info', messageKey, params });
  }

  warning(messageKey: string, params?: Record<string, unknown>): void {
    this.show({ level: 'warning', messageKey, params });
  }

  error(messageKey: string, params?: Record<string, unknown>): void {
    this.show({ level: 'error', messageKey, params, durationMs: 7000 });
  }

  dismiss(dedupeKey: string): void {
    this.dismissedKeys.push(dedupeKey);
  }

  clear(): void {
    this.notifications.length = 0;
    this.dismissedKeys.length = 0;
  }
}
