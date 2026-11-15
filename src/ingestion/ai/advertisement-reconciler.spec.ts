
import { describe, expect, it } from 'vitest';
import type { AiAdvertisement } from './ollama-interpreter.js';
import { reconcileAdvertisement } from './advertisement-reconciler.js';

describe('advertisement reconciliation', () => {
    it('removes invalid rice package sizes', () => {
        const source =
            'TILDA PURE BASMATI RICE OR 817 ELEPHANT BRAND BASMATI RICE';

        const ai: AiAdvertisement = {
            products: [
                {
                    sourceName: 'TILDA PURE BASMATI RICE',
                    brand: 'TILDA',
                    packageSize: 'PURE BASMATI RICE',
                },
                {
                    sourceName: '817 ELEPHANT BRAND BASMATI RICE',
                    brand: '817 ELEPHANT',
                    packageSize: 'BASMATI RICE',
                },
            ],
            relationship: 'alternatives',
            priceText: null,
            packageSizeRange: null,
            conditions: ['OR'],
            uncertainties: [
                'Exact package sizes are not specified.',
            ],
        };

        const result = reconcileAdvertisement(source, ai);

        expect(result.products).toHaveLength(2);
        expect(result.products[0].packageSize).toBeNull();
        expect(result.products[1].packageSize).toBeNull();
        expect(result.products[0].status).toBe('REVIEW');
        expect(result.products[1].status).toBe('REVIEW');
        expect(result.conditions).toEqual([]);
        expect(result.requiresReview).toBe(true);

        // The AI input is preserved, not silently rewritten.
        expect(ai.products[0].packageSize).toBe('PURE BASMATI RICE');
    });

    it('rejects range endpoints as exact package sizes', () => {
        const source =
            "Kellogg's Corn Flakes OR Froot Loops 300-450 g " +
            '$3.99 each Limit 4. Members only.';

        const ai: AiAdvertisement = {
            products: [
                {
                    sourceName: "Kellogg's Corn Flakes",
                    brand: "Kellogg's",
                    packageSize: '450 g',
                },
                {
                    sourceName: 'Froot Loops',
                    brand: "Kellogg's",
                    packageSize: '300 g',
                },
            ],
            relationship: 'alternatives',
            priceText: '$3.99 each',
            packageSizeRange: '300-450 g',
            conditions: ['Limit 4.', 'Members only.'],
            uncertainties: [],
        };

        const result = reconcileAdvertisement(source, ai);

        expect(result.products[0].packageSize).toBeNull();
        expect(result.products[1].packageSize).toBeNull();
        expect(result.packageSizeRange).toBe('300-450 g');
        expect(result.priceText).toBe('$3.99 each');
        expect(result.conditions).toEqual([
            'Limit 4.',
            'Members only.',
        ]);
        expect(result.requiresReview).toBe(true);
    });

    it('keeps an explicitly stated package size for identity review', () => {
        const source = 'TILDA BASMATI RICE 4.54 kg';

        const ai: AiAdvertisement = {
            products: [
                {
                    sourceName: 'TILDA BASMATI RICE 4.54 kg',
                    brand: 'TILDA',
                    packageSize: '4.54 kg',
                },
            ],
            relationship: 'single',
            priceText: null,
            packageSizeRange: null,
            conditions: [],
            uncertainties: [],
        };

        const result = reconcileAdvertisement(source, ai);

        expect(result.products[0].packageSize).toBe('4.54 kg');
        expect(result.products[0].status).toBe(
            'READY_FOR_IDENTITY_RESOLUTION',
        );
        expect(result.requiresReview).toBe(false);
    });

    it('rejects a product name absent from the source', () => {
        const source = 'TILDA BASMATI RICE 4.54 kg';

        const ai: AiAdvertisement = {
            products: [
                {
                    sourceName: 'Premium Jasmine Rice',
                    brand: 'Premium',
                    packageSize: '4.54 kg',
                },
            ],
            relationship: 'single',
            priceText: null,
            packageSizeRange: null,
            conditions: [],
            uncertainties: [],
        };

        const result = reconcileAdvertisement(source, ai);

        expect(result.products[0].sourceName).toBeNull();
        expect(result.products[0].brand).toBeNull();
        expect(result.products[0].status).toBe('REVIEW');
    });
});
