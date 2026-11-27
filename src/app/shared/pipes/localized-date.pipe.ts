import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'localizedDate',
  standalone: true,
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(
    value: Date | string | number | null | undefined,
    format: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
  ): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const currentLang = this.transloco.getActiveLang() || 'fr';
    const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';

    return new Intl.DateTimeFormat(locale, format).format(date);
  }
}
