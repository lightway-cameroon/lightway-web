import { describe, it, expect } from 'vitest';
import fr from '../../../assets/i18n/fr.json';
import en from '../../../assets/i18n/en.json';

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getLeafKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe('i18n translation completeness', () => {
  it('should have exactly matching keys in fr.json and en.json', () => {
    const frKeys = getLeafKeys(fr);
    const enKeys = getLeafKeys(en);

    expect(frKeys).toEqual(enKeys);
  });

  it('should not contain empty translation values', () => {
    const checkNoEmptyValues = (obj: Record<string, unknown>, file: string) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          checkNoEmptyValues(value as Record<string, unknown>, file);
        } else if (typeof value === 'string') {
          expect(
            value.trim().length,
            `Empty translation for key ${key} in ${file}`,
          ).toBeGreaterThan(0);
        }
      }
    };

    checkNoEmptyValues(fr, 'fr.json');
    checkNoEmptyValues(en, 'en.json');
  });
});
