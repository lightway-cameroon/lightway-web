import { ConnectivityStatus } from './connectivity-monitor.port';
import { Clock } from '../time/clock.port';

export type StateMachineListener = (
  newStatus: ConnectivityStatus,
  prevStatus: ConnectivityStatus,
) => void;

export interface StateMachineActionCallback {
  onScheduleProbe?: (delayMs: number) => void;
  onCancelScheduledProbe?: () => void;
}

export class ConnectivityStateMachine {
  private _status: ConnectivityStatus = 'LIMITED';
  private consecutiveFailures = 0;
  private currentBackoffSec = 15;
  private isBrowserOnline = true;
  private offlineDebounceMsRemaining: number | null = null;
  private nextProbeDelayRemaining: number | null = null;
  private readonly listeners: StateMachineListener[] = [];

  constructor(
    private readonly clock?: Clock,
    private readonly callbacks?: StateMachineActionCallback,
  ) {}

  get status(): ConnectivityStatus {
    return this._status;
  }

  get consecutiveFailureCount(): number {
    return this.consecutiveFailures;
  }

  get currentBackoff(): number {
    return this.currentBackoffSec;
  }

  subscribe(listener: StateMachineListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  browserOnline(online: boolean): void {
    this.isBrowserOnline = online;

    if (!online) {
      // Rule 1: browserOnline(false) -> OFFLINE after 1.5s stability (anti-rebond)
      this.offlineDebounceMsRemaining = 1500;
      this.callbacks?.onCancelScheduledProbe?.();
    } else {
      // Cancel offline debounce if browser came back online before 1.5s
      this.offlineDebounceMsRemaining = null;
      // Rule 2: browserOnline(true) -> triggers probe, temporary state LIMITED until result
      if (this._status !== 'ONLINE') {
        this.setStatus('LIMITED');
      }
      this.scheduleProbe(0);
    }
  }

  probeResult(ok: boolean): void {
    if (ok) {
      this.onSuccess();
    } else {
      this.onFailure();
    }
  }

  requestSuccess(): void {
    this.onSuccess();
  }

  requestFailure(kind: 'NETWORK' | 'TIMEOUT'): void {
    void kind;
    this.onFailure();
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.currentBackoffSec = 15; // Reset backoff to 15s
    this.setStatus('ONLINE');
    this.nextProbeDelayRemaining = null;
    this.callbacks?.onCancelScheduledProbe?.();
  }

  private onFailure(): void {
    this.consecutiveFailures++;

    if (this._status === 'ONLINE' && this.consecutiveFailures >= 2) {
      // Rule 4: 2 consecutive failures in ONLINE -> LIMITED
      this.setStatus('LIMITED');
    }

    if (this.isBrowserOnline) {
      // Rule 5: in LIMITED or OFFLINE with browser online, schedule next probe with backoff: 15s -> 30s -> 60s
      const delayMs = this.currentBackoffSec * 1000;
      this.scheduleProbe(delayMs);

      // Increase backoff for next time: 15s -> 30s -> 60s (capped)
      if (this.currentBackoffSec === 15) {
        this.currentBackoffSec = 30;
      } else if (this.currentBackoffSec >= 30) {
        this.currentBackoffSec = 60;
      }
    }
  }

  private scheduleProbe(delayMs: number): void {
    this.nextProbeDelayRemaining = delayMs;
    this.callbacks?.onScheduleProbe?.(delayMs);
  }

  advanceTime(ms: number): { shouldProbe: boolean } {
    let shouldProbe = false;

    // Handle offline debounce (1.5s)
    if (this.offlineDebounceMsRemaining !== null) {
      this.offlineDebounceMsRemaining -= ms;
      if (this.offlineDebounceMsRemaining <= 0) {
        this.offlineDebounceMsRemaining = null;
        this.setStatus('OFFLINE');
      }
    }

    // Handle probe delay
    if (this.nextProbeDelayRemaining !== null) {
      this.nextProbeDelayRemaining -= ms;
      if (this.nextProbeDelayRemaining <= 0) {
        this.nextProbeDelayRemaining = null;
        shouldProbe = true;
      }
    }

    return { shouldProbe };
  }

  private setStatus(newStatus: ConnectivityStatus): void {
    if (this._status === newStatus) return;
    const prev = this._status;
    this._status = newStatus;
    for (const listener of this.listeners) {
      listener(newStatus, prev);
    }
  }
}
