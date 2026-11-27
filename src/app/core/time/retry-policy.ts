import { ErrorCode } from '../errors/error-code';

export interface RetryPolicy {
  nextDelayMs(attempt: number): number | null;
  isRetryable(error: { code: ErrorCode }, isMutation: boolean, clientMutationId?: string): boolean;
}

export class DefaultRetryPolicy implements RetryPolicy {
  private readonly baseDelays = [400, 1200, 3000];

  nextDelayMs(attempt: number): number | null {
    if (attempt < 1 || attempt > this.baseDelays.length) {
      return null;
    }
    const base = this.baseDelays[attempt - 1];
    // 20% random jitter (0.8 to 1.2)
    const jitter = 0.8 + Math.random() * 0.4;
    return Math.round(base * jitter);
  }

  isRetryable(error: { code: ErrorCode }, isMutation: boolean, clientMutationId?: string): boolean {
    const isRetryableError =
      error.code === 'NETWORK' || error.code === 'TIMEOUT' || error.code === 'RATE_LIMITED';
    if (!isRetryableError) {
      return false;
    }
    // Never retry a mutation without a clientMutationId
    if (isMutation && !clientMutationId) {
      return false;
    }
    return true;
  }
}

export const defaultRetryPolicy = new DefaultRetryPolicy();
