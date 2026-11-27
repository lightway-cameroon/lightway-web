import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  template: `
    <header class="page-header" *transloco="let t">
      <div class="header-titles">
        <h1 class="page-title">{{ t(titleKey()) }}</h1>
        @if (subtitleKey()) {
          <p class="page-subtitle">{{ t(subtitleKey()!) }}</p>
        }
      </div>
      <div class="header-actions">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .page-title {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .page-subtitle {
        margin: 4px 0 0;
        color: var(--mat-sys-on-surface-variant, #666);
        font-size: 0.95rem;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string>();
}
