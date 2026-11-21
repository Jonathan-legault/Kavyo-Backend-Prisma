import { describe, expect, it } from 'vitest';
import { classifyGroceryScope } from './grocery-scope.js';
import { classifyFamily } from '../../flyers/normalization/flyer-normalizer.js';

describe('Apple AirTag grocery-scope regression', () => {
  it.each([
    'APPLE AIR TAG (2ND GENERATION) 4-PACK',
    'Apple AirTag 4 Pack',
    'Apple AirTag 4-Pack',
  ])('excludes electronics: %s', (name) => {
    const result = classifyGroceryScope({ name, brand: 'Apple' });

    expect(result.status).toBe('OUT_OF_SCOPE');
    expect(result.category).toBe('ELECTRONICS');
    expect(classifyFamily(name, null)).toBeNull();
  });

  it('preserves fresh apples as produce', () => {
    const name = 'Fresh Gala Apples 3 lb';

    expect(classifyGroceryScope({ name }).status).toBe('IN_SCOPE');
    expect(classifyFamily(name, null)).toBe('produce');
  });

  it('preserves apple juice as a beverage', () => {
    const name = 'Apple Juice 1 L';

    expect(classifyGroceryScope({ name }).status).toBe('IN_SCOPE');
    expect(classifyFamily(name, null)).toBe('juice');
  });
});
