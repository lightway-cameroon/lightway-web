import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, MatButtonModule, MatIconModule],
  template: `
    <div class="forbidden-container" *transloco="let t">
      <mat-icon class="forbidden-icon" color="warn">block</mat-icon>
      <h1>{{ t('layout.forbidden.title') }}</h1>
      <p>{{ t('errors.FORBIDDEN') }}</p>
      <a mat-flat-button color="primary" routerLink="/">
        {{ t('common.close') }}
      </a>
    </div>
  `,
  styles: `
    .forbidden-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 2rem;
    }
    .forbidden-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ForbiddenPage {}
