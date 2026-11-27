import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container" *transloco="let t">
      <mat-icon class="not-found-icon">help_outline</mat-icon>
      <h1>{{ t('layout.notFound.title') }}</h1>
      <p>{{ t('errors.NOT_FOUND') }}</p>
      <a mat-flat-button color="primary" routerLink="/">
        {{ t('common.close') }}
      </a>
    </div>
  `,
  styles: `
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 2rem;
    }
    .not-found-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFoundPage {}
