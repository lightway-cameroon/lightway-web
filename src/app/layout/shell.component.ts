import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { saveLanguagePreference } from '../core/i18n/language-preference';
import { PERMISSION_POLICY } from '../core/permissions';
import { OfflineBannerComponent } from './offline-banner.component';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslocoDirective,
    OfflineBannerComponent,
    UserMenuComponent,
  ],
  template: `
    <div class="shell-container" [class.dark-theme]="isDark()" *transloco="let t">
      <app-offline-banner />

      <mat-toolbar color="primary" class="shell-toolbar">
        <button mat-icon-button (click)="sidenavOpened.set(!sidenavOpened())">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="app-title">{{ t('layout.appName') }}</span>

        <span class="toolbar-spacer"></span>

        <!-- Language toggle -->
        <button
          mat-button
          class="lang-toggle-btn"
          (click)="toggleLanguage()"
          [matTooltip]="t(currentLang() === 'fr' ? 'common.english' : 'common.french')"
        >
          {{ currentLang().toUpperCase() }}
        </button>

        <!-- Theme toggle -->
        <button
          mat-icon-button
          (click)="toggleTheme()"
          [matTooltip]="t(isDark() ? 'common.lightMode' : 'common.darkMode')"
        >
          <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- User menu -->
        <app-user-menu />
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav [opened]="sidenavOpened()" mode="side" class="shell-sidenav">
          <mat-nav-list>
            @if (canAccessAccounts()) {
              <a mat-list-item routerLink="/accounts" routerLinkActive="active-link">
                <mat-icon matListItemIcon>people</mat-icon>
                <span matListItemTitle>{{ t('layout.nav.accounts') }}</span>
              </a>
            }

            @if (canAccessAudit()) {
              <a mat-list-item routerLink="/audit" routerLinkActive="active-link">
                <mat-icon matListItemIcon>security</mat-icon>
                <span matListItemTitle>{{ t('layout.nav.audit') }}</span>
              </a>
            }

            <a mat-list-item routerLink="/profile" routerLinkActive="active-link">
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>{{ t('layout.nav.profile') }}</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="shell-content">
          <main class="page-body">
            <router-outlet />
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .shell-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }

      .shell-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 10;
      }

      .app-title {
        font-weight: 600;
        font-size: 1.25rem;
        letter-spacing: -0.01em;
        margin-left: 8px;
      }

      .toolbar-spacer {
        flex: 1 1 auto;
      }

      .lang-toggle-btn {
        font-weight: 600;
        min-width: 44px;
      }

      .sidenav-container {
        flex: 1;
      }

      .shell-sidenav {
        width: 240px;
        border-right: 1px solid rgba(0, 0, 0, 0.12);
        padding-top: 8px;
      }

      .shell-content {
        padding: 24px;
        overflow-y: auto;
        background-color: var(--mat-sys-surface, #fafafa);
      }

      .page-body {
        max-width: 1200px;
        margin: 0 auto;
      }

      .active-link {
        background-color: rgba(0, 0, 0, 0.04);
        font-weight: 600;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly permissions = inject(PERMISSION_POLICY);

  readonly sidenavOpened = signal<boolean>(true);
  readonly isDark = signal<boolean>(false);
  readonly currentLang = signal<'fr' | 'en'>(
    (this.transloco.getActiveLang() as 'fr' | 'en') || 'fr',
  );

  canAccessAccounts(): boolean {
    return this.permissions.can('accounts.read');
  }

  canAccessAudit(): boolean {
    return this.permissions.can('audit.read');
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'fr' ? 'en' : 'fr';
    this.transloco.setActiveLang(nextLang);
    this.currentLang.set(nextLang);
    saveLanguagePreference(nextLang);
  }

  toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    if (next) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
