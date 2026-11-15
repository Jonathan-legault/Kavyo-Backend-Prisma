
import { describe, expect, it } from 'vitest';
import {
    classifyGroceryScope,
    type ScopeStatus,
} from './grocery-scope.js';

describe('AI V3 scope audit regressions', () => {
    const cases: Array<{
        name: string;
        expected: ScopeStatus;
    }> = [
            {
                name: 'SNACKLES OR FUGGLER PLUSH',
                expected: 'OUT_OF_SCOPE',
            },
            {
                name: 'FOOD SAVER VACUUM SEALERS OR ROLLS',
                expected: 'REVIEW',
            },
            {
                name: 'Munchkin Sippy Cup',
                expected: 'IN_SCOPE',
            },
            {
                name: 'LIFE AT HOME™ NORDIC STITCH TABLE RUNNER',
                expected: 'OUT_OF_SCOPE',
            },
            {
                name: 'Watermelon',
                expected: 'IN_SCOPE',
            },
            {
                name: 'PC® BLUE MENU® MARGARINE, 907 g',
                expected: 'IN_SCOPE',
            },
        ];

    for (const item of cases) {
        it(`classifies "${item.name}" as ${item.expected}`, () => {
            const result = classifyGroceryScope({
                name: item.name,
                description: null,
                brand: null,
            });

            expect(result.status).toBe(item.expected);
        });
    }

    it('keeps pet toys in scope', () => {
        expect(
            classifyGroceryScope({
                name: 'Dog Plush Toy',
            }).status,
        ).toBe('IN_SCOPE');
    });

    it('keeps edible holiday products in scope', () => {
        expect(
            classifyGroceryScope({
                name: 'Diwali Chocolate Sweets',
            }).status,
        ).toBe('IN_SCOPE');
    });
});
