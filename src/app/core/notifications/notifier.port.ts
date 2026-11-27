import { InjectionToken } from '@angular/core';

export type NotificationLevel = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  level: NotificationLevel;
  messageKey: string;
  params?: Record<string, unknown>;
  dedupeKey?: string;
  durationMs?: number;
  action?: { labelKey: string; run: () => void };
}

export interface Notifier {
  show(n: Notification): void;
  success(messageKey: string, params?: Record<string, unknown>): void;
  info(messageKey: string, params?: Record<string, unknown>): void;
  warning(messageKey: string, params?: Record<string, unknown>): void;
  error(messageKey: string, params?: Record<string, unknown>): void;
  dismiss(dedupeKey: string): void;
}

export const NOTIFIER = new InjectionToken<Notifier>('NOTIFIER');
