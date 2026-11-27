import { computed, signal, Signal } from '@angular/core';
import { ConnectivityMonitor, ConnectivityStatus } from '../connectivity/connectivity-monitor.port';

export class FakeConnectivityMonitor implements ConnectivityMonitor {
  private readonly _status = signal<ConnectivityStatus>('ONLINE');
  readonly status: Signal<ConnectivityStatus> = this._status.asReadonly();
  readonly canWrite: Signal<boolean> = computed(() => this._status() !== 'OFFLINE');

  recordedSuccesses = 0;
  recordedFailures: ('NETWORK' | 'TIMEOUT')[] = [];
  reconnectCallbacks: (() => void)[] = [];

  setStatus(status: ConnectivityStatus): void {
    const prev = this._status();
    this._status.set(status);
    if (status === 'ONLINE' && prev !== 'ONLINE') {
      for (const cb of this.reconnectCallbacks) {
        cb();
      }
    }
  }

  recordRequestSuccess(): void {
    this.recordedSuccesses++;
  }

  recordRequestFailure(kind: 'NETWORK' | 'TIMEOUT'): void {
    this.recordedFailures.push(kind);
  }

  async checkNow(): Promise<ConnectivityStatus> {
    return this._status();
  }

  onReconnect(callback: () => void): () => void {
    this.reconnectCallbacks.push(callback);
    return () => {
      const idx = this.reconnectCallbacks.indexOf(callback);
      if (idx !== -1) this.reconnectCallbacks.splice(idx, 1);
    };
  }
}
