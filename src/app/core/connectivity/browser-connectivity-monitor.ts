import { computed, DestroyRef, inject, Injectable, signal, Signal } from '@angular/core';
import { ConnectivityMonitor, ConnectivityStatus } from './connectivity-monitor.port';
import { ConnectivityStateMachine } from './connectivity-state-machine';
import { GatewayProber } from './gateway-prober';
import { NOTIFIER } from '../notifications/notifier.port';

@Injectable({ providedIn: 'root' })
export class BrowserConnectivityMonitor implements ConnectivityMonitor {
  private readonly prober = inject(GatewayProber);
  private readonly notifier = inject(NOTIFIER, { optional: true });
  private readonly destroyRef = inject(DestroyRef, { optional: true });

  private readonly _status = signal<ConnectivityStatus>('ONLINE');
  readonly status: Signal<ConnectivityStatus> = this._status.asReadonly();
  readonly canWrite: Signal<boolean> = computed(() => this._status() !== 'OFFLINE');

  private readonly stateMachine: ConnectivityStateMachine;
  private readonly reconnectListeners = new Set<() => void>();
  private scheduledProbeTimeout: ReturnType<typeof setTimeout> | null = null;
  private offlineDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private isTabVisible = true;

  constructor() {
    this.stateMachine = new ConnectivityStateMachine(undefined, {
      onScheduleProbe: (delayMs) => this.scheduleProbe(delayMs),
      onCancelScheduledProbe: () => this.cancelScheduledProbe(),
    });

    this.stateMachine.subscribe((newStatus, prevStatus) => {
      this._status.set(newStatus);

      // Notify on reconnection
      if (newStatus === 'ONLINE' && (prevStatus === 'OFFLINE' || prevStatus === 'LIMITED')) {
        this.notifier?.success('connectivity.restored');
        for (const cb of this.reconnectListeners) {
          cb();
        }
      }
    });

    if (typeof window !== 'undefined') {
      const onOnline = () => {
        if (this.offlineDebounceTimeout) {
          clearTimeout(this.offlineDebounceTimeout);
          this.offlineDebounceTimeout = null;
        }
        this.stateMachine.browserOnline(true);
      };

      const onOffline = () => {
        // Debounce 1.5s
        if (this.offlineDebounceTimeout) clearTimeout(this.offlineDebounceTimeout);
        this.offlineDebounceTimeout = setTimeout(() => {
          this.stateMachine.browserOnline(false);
          this.stateMachine.advanceTime(1500);
        }, 1500);
      };

      const onVisibilityChange = () => {
        const visible = document.visibilityState === 'visible';
        this.isTabVisible = visible;
        if (visible) {
          // Probe once when returning to tab
          this.checkNow();
        } else {
          // Stop scheduled probes when tab is hidden
          this.cancelScheduledProbe();
        }
      };

      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      document.addEventListener('visibilitychange', onVisibilityChange);

      this.destroyRef?.onDestroy(() => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        this.cancelScheduledProbe();
        if (this.offlineDebounceTimeout) clearTimeout(this.offlineDebounceTimeout);
      });

      // Initial check
      if (!navigator.onLine) {
        onOffline();
      } else {
        this.checkNow();
      }
    }
  }

  recordRequestSuccess(): void {
    this.stateMachine.requestSuccess();
  }

  recordRequestFailure(kind: 'NETWORK' | 'TIMEOUT'): void {
    this.stateMachine.requestFailure(kind);
  }

  async checkNow(): Promise<ConnectivityStatus> {
    const ok = await this.prober.probe();
    this.stateMachine.probeResult(ok);
    return this.stateMachine.status;
  }

  onReconnect(callback: () => void): () => void {
    this.reconnectListeners.add(callback);
    return () => this.reconnectListeners.delete(callback);
  }

  private scheduleProbe(delayMs: number): void {
    this.cancelScheduledProbe();
    if (!this.isTabVisible) return;

    this.scheduledProbeTimeout = setTimeout(async () => {
      this.scheduledProbeTimeout = null;
      await this.checkNow();
    }, delayMs);
  }

  private cancelScheduledProbe(): void {
    if (this.scheduledProbeTimeout) {
      clearTimeout(this.scheduledProbeTimeout);
      this.scheduledProbeTimeout = null;
    }
  }
}
