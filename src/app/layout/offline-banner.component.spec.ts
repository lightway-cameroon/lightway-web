import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideTransloco, TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';
import { OfflineBannerComponent } from './offline-banner.component';
import {
  CONNECTIVITY_MONITOR,
  ConnectivityMonitor,
  ConnectivityStatus,
} from '../core/connectivity';

class FakeTranslocoLoader implements TranslocoLoader {
  getTranslation() {
    return of({
      connectivity: {
        offline: 'Hors ligne',
        limited: 'Connectivité limitée',
        restored: 'En ligne',
      },
    });
  }
}

describe('OfflineBannerComponent', () => {
  let fixture: ComponentFixture<OfflineBannerComponent>;
  let statusSignal = signal<ConnectivityStatus>('ONLINE');

  const fakeConnectivityMonitor: ConnectivityMonitor = {
    status: statusSignal.asReadonly(),
    canWrite: computed(() => statusSignal() !== 'OFFLINE'),
    recordRequestSuccess: () => undefined,
    recordRequestFailure: () => undefined,
    checkNow: async () => statusSignal(),
    onReconnect: () => () => undefined,
  };

  beforeEach(async () => {
    statusSignal = signal<ConnectivityStatus>('ONLINE');
    Object.assign(fakeConnectivityMonitor, {
      status: statusSignal.asReadonly(),
      canWrite: computed(() => statusSignal() !== 'OFFLINE'),
    });

    await TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        {
          provide: CONNECTIVITY_MONITOR,
          useValue: fakeConnectivityMonitor,
        },
        provideTransloco({
          config: {
            availableLangs: ['fr'],
            defaultLang: 'fr',
          },
          loader: FakeTranslocoLoader,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineBannerComponent);
    fixture.detectChanges();
  });

  it('should not display banner when online', () => {
    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeNull();
  });

  it('should display offline banner when status is offline', () => {
    statusSignal.set('OFFLINE');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).not.toBeNull();
    expect(banner.classList.contains('limited')).toBe(false);
  });

  it('should display limited banner with limited class when status is limited', () => {
    statusSignal.set('LIMITED');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).not.toBeNull();
    expect(banner.classList.contains('limited')).toBe(true);
  });
});
