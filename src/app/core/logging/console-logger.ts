import { inject, Injectable } from '@angular/core';
import { Logger } from './logger.port';
import { APP_CONFIG } from '../config/app-config.token';
import { AppConfig } from '../config/app-config';

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'email',
  'authorization',
]);

const LOG_LEVEL_SEVERITY: Record<'debug' | 'info' | 'warn' | 'error', number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

@Injectable({ providedIn: 'root' })
export class ConsoleLogger implements Logger {
  private readonly config?: AppConfig;

  constructor() {
    try {
      this.config = inject(APP_CONFIG, { optional: true }) ?? undefined;
    } catch {
      // In case ConsoleLogger is instantiated directly without injection context
      this.config = undefined;
    }
  }

  private get minLevel(): 'debug' | 'info' | 'warn' | 'error' {
    if (this.config?.environment === 'production') {
      return 'warn';
    }
    return 'debug';
  }

  debug(msg: string, ctx?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${msg}`, this.sanitize(ctx));
    }
  }

  info(msg: string, ctx?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${msg}`, this.sanitize(ctx));
    }
  }

  warn(msg: string, ctx?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${msg}`, this.sanitize(ctx));
    }
  }

  error(msg: string, ctx?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${msg}`, this.sanitize(ctx));
    }
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[this.minLevel];
  }

  public sanitize(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!ctx) return undefined;
    return this.scrubObject(ctx);
  }

  private scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        clean[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = this.scrubObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        clean[key] = value.map((item) =>
          item && typeof item === 'object'
            ? this.scrubObject(item as Record<string, unknown>)
            : item,
        );
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }
}
