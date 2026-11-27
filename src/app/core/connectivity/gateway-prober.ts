import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

@Injectable({ providedIn: 'root' })
export class GatewayProber {
  private readonly config = inject(APP_CONFIG, { optional: true });

  async probe(healthUrl?: string): Promise<boolean> {
    const url = healthUrl ?? this.config?.healthUrl ?? '/health';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
