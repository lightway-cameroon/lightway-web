import { Injectable } from '@angular/core';
import { Clock } from './clock.port';

@Injectable({ providedIn: 'root' })
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
