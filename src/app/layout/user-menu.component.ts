import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { SessionManager } from '../core/auth';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule, TranslocoDirective],
  template: `
    @if (session(); as userSession) {
      <div class="user-menu-wrapper" *transloco="let t">
        <button mat-button [matMenuTriggerFor]="menu" class="user-trigger">
          <mat-icon class="user-avatar-icon">account_circle</mat-icon>
          <span class="user-name">{{ userSession.user.displayName || userSession.user.id }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>

        <mat-menu #menu="matMenu" xPosition="before">
          <div class="user-menu-header">
            <span class="user-menu-role">{{ userSession.user.role }}</span>
          </div>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>{{ t('auth.logout') }}</span>
          </button>
        </mat-menu>
      </div>
    }
  `,
  styles: [
    `
      .user-menu-wrapper {
        display: inline-block;
      }

      .user-trigger {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }

      .user-avatar-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .user-menu-header {
        padding: 8px 16px;
        font-size: 0.8rem;
        color: var(--mat-sys-on-surface-variant, #666);
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  private readonly sessionManager = inject(SessionManager);
  private readonly router = inject(Router);

  readonly session = this.sessionManager.session;

  async logout(): Promise<void> {
    await this.sessionManager.logout();
    await this.router.navigate(['/login']);
  }
}
