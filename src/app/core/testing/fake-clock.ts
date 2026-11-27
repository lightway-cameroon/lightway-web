import { Clock } from '../time/clock.port';

export class FakeClock implements Clock {
  private currentTime: Date;

  constructor(initialTime: Date = new Date('2026-01-01T00:00:00.000Z')) {
    this.currentTime = new Date(initialTime.getTime());
  }

  now(): Date {
    return new Date(this.currentTime.getTime());
  }

  setNow(date: Date): void {
    this.currentTime = new Date(date.getTime());
  }

  advanceMs(ms: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }
}
