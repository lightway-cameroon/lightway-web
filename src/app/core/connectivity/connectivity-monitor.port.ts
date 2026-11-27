import { InjectionToken, Signal } from '@angular/core';

export type ConnectivityStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE';

export interface ConnectivityMonitor {
  readonly status: Signal<ConnectivityStatus>;
  readonly canWrite: Signal<boolean>; // true si status !== 'OFFLINE'
  recordRequestSuccess(): void; // appelé par le client GraphQL
  recordRequestFailure(kind: 'NETWORK' | 'TIMEOUT'): void;
  checkNow(): Promise<ConnectivityStatus>;
  onReconnect(callback: () => void): () => void;
}

export const CONNECTIVITY_MONITOR = new InjectionToken<ConnectivityMonitor>('CONNECTIVITY_MONITOR');
