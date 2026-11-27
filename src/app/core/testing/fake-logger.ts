import { Logger } from '../logging/logger.port';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  ctx?: Record<string, unknown>;
}

export class FakeLogger implements Logger {
  readonly logs: LogEntry[] = [];

  debug(msg: string, ctx?: Record<string, unknown>): void {
    this.logs.push({ level: 'debug', msg, ctx });
  }

  info(msg: string, ctx?: Record<string, unknown>): void {
    this.logs.push({ level: 'info', msg, ctx });
  }

  warn(msg: string, ctx?: Record<string, unknown>): void {
    this.logs.push({ level: 'warn', msg, ctx });
  }

  error(msg: string, ctx?: Record<string, unknown>): void {
    this.logs.push({ level: 'error', msg, ctx });
  }

  clear(): void {
    this.logs.length = 0;
  }
}
