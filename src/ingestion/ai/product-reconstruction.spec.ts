
import { describe, expect, it } from 'vitest';
import { reconstructProducts } from './product-reconstruction.js';

describe('source-backed product reconstruction', () => {
    it('proposes four Dove combinations for review', () => {
        const results = reconstructProducts({
            sourceItemId: '1052443710',
            name: 'Dove or Dove Men+Care shampoo or conditioner',
            brand: 'Dove',
            description: 'Each. Selected varieties. 530 mL.',
        });

        expect(results).toHaveLength(4);

        expect(results.map(r => r.productName)).toEqual([
            'Dove shampoo',
            'Dove conditioner',
            'Dove Men+Care shampoo',
            'Dove Men+Care conditioner',
        ]);

        expect(results.every(
            r => r.status === 'RECONSTRUCTION_REVIEW',
        )).toBe(true);

        expect(results.every(
            r => r.brand === null &&
                r.quantityValue === null &&
                !r.automaticPromotionEligible,
        )).toBe(true);
    });

    it('attributes separate quantities for Rogers alternatives', () => {
        const results = reconstructProducts({
            sourceItemId: '1051687887',
            name: 'Rogers Granola',
            brand: 'ROGERS',
            description: '(750g) or Oats (1kg), Selected Varieties',
        });

        expect(results).toHaveLength(2);

        expect(results.map(r => [
            r.productName,
            r.quantityValue,
            r.quantityUnit,
        ])).toEqual([
            ['Rogers Granola', 750, 'g'],
            ['Oats', 1, 'kg'],
        ]);

        expect(results.every(
            r => r.brand === null &&
                r.status === 'RECONSTRUCTION_REVIEW',
        )).toBe(true);
    });

    it('does not reconstruct unrelated prose', () => {
        const results = reconstructProducts({
            sourceItemId: 'test',
            name: 'Western Family Parchment Paper',
            brand: null,
            description: 'or Wax, Selected Varieties',
        });

        expect(results).toEqual([]);
    });

    it('does not construct a product from a simple ad', () => {
        const results = reconstructProducts({
            sourceItemId: 'test',
            name: 'Great Value 16-pack candy canes',
            brand: 'Great Value',
            description: '#183234',
        });

        expect(results).toEqual([]);
    });

    it('rejects invalid paired quantities', () => {
        const results = reconstructProducts({
            sourceItemId: 'test',
            name: 'Rogers Granola',
            brand: 'ROGERS',
            description: '(0g) or Oats (-1kg)',
        });

        expect(results).toEqual([]);
    });

    it('preserves source evidence for every hypothesis', () => {
        const input = {
            sourceItemId: '1052443710',
            name: 'Dove or Dove Men+Care shampoo or conditioner',
            brand: 'Dove',
            description: 'Selected varieties. 530 mL.',
        };

        const results = reconstructProducts(input);

        for (const result of results) {
            expect(result.evidence.length).toBeGreaterThan(0);

            for (const evidence of result.evidence) {
                const source = input[evidence.field];

                expect(source?.toLowerCase()).toContain(
                    evidence.text.toLowerCase(),
                );
            }
        }
    });
});
