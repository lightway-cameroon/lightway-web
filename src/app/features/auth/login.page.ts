import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { SessionManager } from '../../core/auth';
import { NOTIFIER } from '../../core/notifications';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslocoDirective,
  ],
  template: `
    <div class="login-wrapper" *transloco="let t">
      <mat-card class="login-card">
        <mat-card-header class="login-header">
          <div class="login-logo">
            <mat-icon class="logo-icon">shield</mat-icon>
          </div>
          <mat-card-title class="login-title">{{ t('auth.login.title') }}</mat-card-title>
          <mat-card-subtitle class="login-subtitle">{{
            t('auth.login.subtitle')
          }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
            @if (errorMessage()) {
              <div class="form-error" role="alert">
                {{ t(errorMessage()!) }}
              </div>
            }

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>{{ t('auth.login.email') }}</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" required />
              @if (
                form.controls.email.invalid &&
                (form.controls.email.dirty || form.controls.email.touched)
              ) {
                <mat-error>
                  @if (form.controls.email.hasError('required')) {
                    {{ t('auth.login.emailRequired') }}
                  } @else if (form.controls.email.hasError('email')) {
                    {{ t('auth.login.emailInvalid') }}
                  }
                </mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>{{ t('auth.login.password') }}</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                required
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="'Toggle password visibility'"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (
                form.controls.password.invalid &&
                (form.controls.password.dirty || form.controls.password.touched)
              ) {
                <mat-error>
                  {{ t('auth.login.passwordRequired') }}
                </mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="submit-button"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20" class="spinner"></mat-spinner>
              } @else {
                {{ t('auth.login.submit') }}
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: var(--mat-sys-surface-variant, #f0f2f5);
        padding: 16px;
      }

      .login-card {
        width: 100%;
        max-width: 440px;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }

      .login-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 24px;
      }

      .login-logo {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: var(--mat-sys-primary, #1976d2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .logo-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .login-title {
        font-size: 1.35rem;
        font-weight: 600;
        margin: 0;
      }

      .login-subtitle {
        font-size: 0.9rem;
        color: var(--mat-sys-on-surface-variant, #666);
        margin-top: 4px;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-field {
        width: 100%;
      }

      .form-error {
        padding: 10px 14px;
        border-radius: 6px;
        background-color: #ffebee;
        color: #c62828;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .submit-button {
        height: 44px;
        font-size: 1rem;
        margin-top: 8px;
      }

      .spinner {
        display: inline-block;
        margin: 0 auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly sessionManager = inject(SessionManager);
  private readonly notifier = inject(NOTIFIER);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    const result = await this.sessionManager.login(email, password);

    this.loading.set(false);

    if (result.ok) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/accounts';
      await this.router.navigateByUrl(returnUrl);
    } else {
      const err = result.error;
      const key = `errors.${err.code}`;
      this.errorMessage.set(key);
      this.notifier.error(key);
    }
  }
}
