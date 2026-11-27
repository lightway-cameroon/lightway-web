import { InjectionToken } from '@angular/core';

export interface IdGenerator {
  uuid(): string;
}

export const ID_GENERATOR = new InjectionToken<IdGenerator>('ID_GENERATOR');
