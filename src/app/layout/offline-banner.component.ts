import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { CONNECTIVITY_MONITOR } from '../core/connectivity';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslocoDirective],
  template: `
    @if (status() === 'OFFLINE' || status() === 'LIMITED') {
      <div
        class="offline-banner"
        [class.limited]="status() === 'LIMITED'"
        *transloco="let t"
        role="alert"
      >
        <mat-icon class="banner-icon">{{
          status() === 'OFFLINE' ? 'wifi_off' : 'signal_cellular_connected_no_internet_4_bar'
        }}</mat-icon>
        <span class="banner-text">
          {{ status() === 'OFFLINE' ? t('connectivity.offline') : t('connectivity.limited') }}
        </span>
      </div>
    }
  `,
  styles: [
    `
      .offline-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 16px;
        background-color: var(--mat-sys-error, #b00020);
        color: var(--mat-sys-on-error, #ffffff);
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        animation: slideDown 0.2s ease-out;
      }

      .offline-banner.limited {
        background-color: #f57c00;
        color: #ffffff;
      }

      .banner-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBannerComponent {
  private readonly connectivity = inject(CONNECTIVITY_MONITOR);
  readonly status = this.connectivity.status;
}
