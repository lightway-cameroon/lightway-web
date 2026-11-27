import { Injectable } from '@angular/core';
import { IdGenerator } from './id-generator.port';

@Injectable({ providedIn: 'root' })
export class UuidIdGenerator implements IdGenerator {
  uuid(): string {
    return crypto.randomUUID();
  }
}
