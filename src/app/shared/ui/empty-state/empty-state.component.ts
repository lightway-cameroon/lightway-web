import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslocoDirective],
  template: `
    <div class="empty-state" *transloco="let t">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3 class="empty-title">{{ t(titleKey()) }}</h3>
      @if (descriptionKey()) {
        <p class="empty-description">{{ t(descriptionKey()!) }}</p>
      }
      <div class="empty-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: var(--mat-sys-on-surface-variant, #757575);
      }

      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.6;
      }

      .empty-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--mat-sys-on-surface, #212121);
      }

      .empty-description {
        margin: 8px 0 24px;
        max-width: 400px;
        font-size: 0.95rem;
      }

      .empty-actions {
        display: flex;
        gap: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string>();
}
