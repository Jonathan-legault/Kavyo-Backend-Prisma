
import { describe, expect, it } from 'vitest';
import { classifyGroceryScope, type ScopeStatus } from './grocery-scope.js';

describe('Flipp capture scope regression', () => {
    const cases: Array<{
        name: string;
        status: ScopeStatus;
        category: string;
    }> = [
            {
                name: 'FRESH ASC TILAPIA FILLETS',
                status: 'IN_SCOPE',
                category: 'GROCERY',
            },
            {
                name: 'PURPLE YAM',
                status: 'IN_SCOPE',
                category: 'GROCERY',
            },
            {
                name: 'PAPAYA',
                status: 'IN_SCOPE',
                category: 'GROCERY',
            },
            {
                name: 'SOYKEI TOFU, 400G',
                status: 'IN_SCOPE',
                category: 'GROCERY',
            },
            {
                name: 'Better Homes & Gardens holiday candle',
                status: 'OUT_OF_SCOPE',
                category: 'HOME_DECOR',
            },
            {
                name: 'Set of 3 LED deer family',
                status: 'OUT_OF_SCOPE',
                category: 'HOME_DECOR',
            },
            {
                name: 'PC PRO PERFORMANCE TRI-PLY STAINLESS STEEL DUTCH OVEN, 5.67 L',
                status: 'OUT_OF_SCOPE',
                category: 'KITCHENWARE',
            },
            {
                name: 'Holiday Time bath robe',
                status: 'OUT_OF_SCOPE',
                category: 'CLOTHING',
            },

            {
                name: 'FRESH FILLED PASTA & SKILLET GNOCCHI, 500G - 700G',
                status: 'IN_SCOPE',
                category: 'GROCERY',
            },
            {
                name: 'SKILLET GNOCCHI, 280G - 300G',
                status: 'IN_SCOPE',
                category: 'GROCERY',
            },
            {
                name: 'PC PRO PERFORMANCE TRI-PLY STAINLESS STEEL SKILLET, 25 CM',
                status: 'OUT_OF_SCOPE',
                category: 'KITCHENWARE',
            },
            {
                name: 'Glade holiday candles 4-pack or PlugIns scented oil refills 5-pack',
                status: 'REVIEW',
                category: 'UNKNOWN',
            },

        ];

    it.each(cases)('$name → $status', ({ name, status, category }) => {
        const result = classifyGroceryScope({ name });
        expect(result.status).toBe(status);
        expect(result.category).toBe(category);
    });

    it('does not infer confectionery solely from a brand', () => {
        expect(
            classifyGroceryScope({
                name: 'LINDT ADVENT CALENDAR, 128/158 G',
            }).status,
        ).toBe('REVIEW');
    });
});
