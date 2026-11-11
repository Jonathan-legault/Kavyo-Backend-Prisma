import { describe, expect, it } from 'vitest';
import { classifyGroceryScope } from './grocery-scope.js';

describe('v4 grocery scope regression', () => {
  it.each([
    ['Planters Cashews', 'IN_SCOPE'],
    ['PC Nutrition First Dry Cat Food', 'IN_SCOPE'],
    ['Pampers Training Pants', 'IN_SCOPE'],
    ['Cedar Bay Air Fryer Entrees', 'IN_SCOPE'],
    ['Depend Absorbent Underwear', 'IN_SCOPE'],
    ['Microwave Popcorn', 'IN_SCOPE'],
    ['LEGO Food Truck Set', 'OUT_OF_SCOPE'],
    ['Fruit of the Loom Socks', 'OUT_OF_SCOPE'],
    ['Coffee Maker', 'OUT_OF_SCOPE'],
    ['Unidentified Limited Offer', 'REVIEW'],
  ] as const)('%s -> %s', (name, status) => {
    expect(classifyGroceryScope({ name }).status).toBe(status);
  });
});
