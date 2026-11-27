import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, TranslocoDirective],
  template: `
    @if (control() && control()!.invalid && (control()!.dirty || control()!.touched)) {
      <mat-error *transloco="let t">
        @if (control()!.hasError('required')) {
          <span>{{ t(requiredKey()) }}</span>
        } @else if (control()!.hasError('email')) {
          <span>{{ t(emailKey()) }}</span>
        } @else if (customErrorKey()) {
          <span>{{ t(customErrorKey()!) }}</span>
        }
      </mat-error>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();
  readonly requiredKey = input<string>('errors.VALIDATION_FAILED');
  readonly emailKey = input<string>('errors.VALIDATION_FAILED');
  readonly customErrorKey = input<string | null>(null);
}
