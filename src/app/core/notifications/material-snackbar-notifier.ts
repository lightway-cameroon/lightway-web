import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';
import { Notification, Notifier } from './notifier.port';

@Injectable({ providedIn: 'root' })
export class MaterialSnackbarNotifier implements Notifier {
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService, { optional: true });

  private currentNotification: Notification | null = null;
  private currentRef: MatSnackBarRef<TextOnlySnackBar> | null = null;
  private readonly errorQueue: Notification[] = [];

  show(notification: Notification): void {
    // If dedupeKey is specified and matches the current notification, ignore
    if (notification.dedupeKey && this.currentNotification?.dedupeKey === notification.dedupeKey) {
      return;
    }

    if (this.currentNotification?.level === 'error' && notification.level !== 'error') {
      // Don't replace an active error with a lower priority notification; queue or ignore
      return;
    }

    if (notification.level === 'error' && this.currentNotification) {
      // If an error arrives while something is displayed, we can display immediately or queue
      this.display(notification);
      return;
    }

    this.display(notification);
  }

  private display(notification: Notification): void {
    this.currentNotification = notification;

    const message = this.transloco
      ? this.transloco.translate(notification.messageKey, notification.params)
      : notification.messageKey;

    const actionLabel = notification.action
      ? this.transloco
        ? this.transloco.translate(notification.action.labelKey)
        : notification.action.labelKey
      : undefined;

    const duration = notification.durationMs ?? (notification.level === 'error' ? 7000 : 4000);
    const panelClass = [`snackbar-${notification.level}`];
    const politeness = notification.level === 'error' ? 'assertive' : 'polite';

    this.currentRef = this.snackBar.open(message, actionLabel, {
      duration,
      panelClass,
      politeness,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });

    if (notification.action) {
      this.currentRef.onAction().subscribe(() => {
        notification.action?.run();
      });
    }

    this.currentRef.afterDismissed().subscribe(() => {
      this.currentRef = null;
      this.currentNotification = null;
      if (this.errorQueue.length > 0) {
        const next = this.errorQueue.shift();
        if (next) this.display(next);
      }
    });
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
    this.show({ level: 'error', messageKey, params });
  }

  dismiss(dedupeKey: string): void {
    if (this.currentNotification?.dedupeKey === dedupeKey) {
      this.currentRef?.dismiss();
      this.currentNotification = null;
    }
  }
}
