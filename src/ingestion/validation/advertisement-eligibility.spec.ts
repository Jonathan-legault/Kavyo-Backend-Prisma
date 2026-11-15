
import { describe, expect, it } from 'vitest';

import {
    checkAdvertisementEligibility,
} from './advertisement-eligibility.js';

describe('advertisement eligibility', () => {
    it('rejects the Diwali promotional banner', () => {
        expect(
            checkAdvertisementEligibility({
                name: 'Banner - Everything for you Diwali glow',
                description: null,
                currentPrice: null,
            }),
        ).toEqual({
            status: 'REJECT',
            reason: 'PROMOTIONAL_BANNER',
        });
    });

    it('does not reject legitimate Diwali products', () => {
        expect(
            checkAdvertisementEligibility({
                name: 'Diwali Sweets Assortment',
                description: '500 g',
                currentPrice: '8.99',
            }).status,
        ).toBe('CONTINUE');
    });

    it('does not reject products solely for missing prices', () => {
        expect(
            checkAdvertisementEligibility({
                name: 'Western Family Parchment Paper',
                description: null,
                currentPrice: null,
            }).status,
        ).toBe('CONTINUE');
    });
});
