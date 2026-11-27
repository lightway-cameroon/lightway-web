import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectivityStateMachine } from './connectivity-state-machine';

describe('ConnectivityStateMachine', () => {
  let sm: ConnectivityStateMachine;
  const scheduledProbes: number[] = [];

  beforeEach(() => {
    scheduledProbes.length = 0;
    sm = new ConnectivityStateMachine(undefined, {
      onScheduleProbe: (delayMs) => scheduledProbes.push(delayMs),
      onCancelScheduledProbe: () => undefined,
    });
  });

  it('anti-rebond de 1.5s sur perte de connexion réseau', () => {
    sm.probeResult(true);
    expect(sm.status).toBe('ONLINE');

    // browser reports offline
    sm.browserOnline(false);
    expect(sm.status).toBe('ONLINE'); // Still online during debounce

    // Advance 1000ms: still within debounce
    sm.advanceTime(1000);
    expect(sm.status).toBe('ONLINE');

    // Advance 500ms more: debounce threshold (1500ms) reached -> OFFLINE
    sm.advanceTime(500);
    expect(sm.status).toBe('OFFLINE');
  });

  it('cancels offline debounce if browser goes back online before 1.5s', () => {
    sm.probeResult(true);
    expect(sm.status).toBe('ONLINE');

    sm.browserOnline(false);
    sm.advanceTime(1000);
    expect(sm.status).toBe('ONLINE');

    // Reconnected before 1.5s
    sm.browserOnline(true);
    sm.advanceTime(1000);
    expect(sm.status).not.toBe('OFFLINE');
  });

  it('devient LIMITED après 2 échecs consécutifs en ONLINE', () => {
    sm.probeResult(true);
    expect(sm.status).toBe('ONLINE');

    // First failure
    sm.requestFailure('NETWORK');
    expect(sm.status).toBe('ONLINE');
    expect(sm.consecutiveFailureCount).toBe(1);

    // Second failure -> LIMITED
    sm.requestFailure('TIMEOUT');
    expect(sm.status).toBe('LIMITED');
    expect(sm.consecutiveFailureCount).toBe(2);
  });

  it('applique une attente croissante de 15s -> 30s -> 60s (plafond)', () => {
    // Starts in LIMITED
    expect(sm.status).toBe('LIMITED');

    // Failure 1: schedules probe at 15s, next backoff is 30s
    sm.probeResult(false);
    expect(scheduledProbes[scheduledProbes.length - 1]).toBe(15000);
    expect(sm.currentBackoff).toBe(30);

    // Failure 2: schedules probe at 30s, next backoff is 60s
    sm.probeResult(false);
    expect(scheduledProbes[scheduledProbes.length - 1]).toBe(30000);
    expect(sm.currentBackoff).toBe(60);

    // Failure 3: schedules probe at 60s, capped at 60s
    sm.probeResult(false);
    expect(scheduledProbes[scheduledProbes.length - 1]).toBe(60000);
    expect(sm.currentBackoff).toBe(60);
  });

  it('succès de requête réelle remet ONLINE et réinitialise l attente à 15s', () => {
    sm.probeResult(false);
    sm.probeResult(false);
    expect(sm.currentBackoff).toBe(60);

    // Real request succeeds
    sm.requestSuccess();
    expect(sm.status).toBe('ONLINE');
    expect(sm.currentBackoff).toBe(15);
    expect(sm.consecutiveFailureCount).toBe(0);
  });

  it('browserOnline(true) ne suffit pas à conclure ONLINE (état LIMITED jusqu à la sonde)', () => {
    // When browser is online initially without probe
    sm.browserOnline(true);
    expect(sm.status).toBe('LIMITED');

    // Probe succeeds -> now ONLINE
    sm.probeResult(true);
    expect(sm.status).toBe('ONLINE');
  });
});
