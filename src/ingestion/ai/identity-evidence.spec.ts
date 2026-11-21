
import { describe, expect, it } from 'vitest';
import {
    attributeIdentityEvidence,
} from './identity-evidence.js';

describe('deterministic product identity evidence', () => {
    it('attributes explicit brand and 16-pack', () => {
        const result = attributeIdentityEvidence({
            advertisementName: 'Great Value 16-pack candy canes',
            advertisementBrand: 'Great Value',
            advertisementDescription: '#183234',
            candidateName: 'Great Value 16-pack candy canes',
            relatedVariantCount: 0,
        });

        expect(result.eligibleForMatching).toBe(true);
        expect(result.brand).toBe('Great Value');
        expect(result.quantityValue).toBe(16);
        expect(result.quantityUnit).toBe('ct');
    });

    it('blocks selected-variety margarine', () => {
        const result = attributeIdentityEvidence({
            advertisementName: 'PC® BLUE MENU® MARGARINE, 907 g',
            advertisementBrand: 'PC',
            advertisementDescription: 'selected varieties',
            candidateName: 'PC® BLUE MENU® MARGARINE',
            relatedVariantCount: 0,
        });

        expect(result.eligibleForMatching).toBe(false);
        expect(result.brand).toBeNull();
        expect(result.reasons).toContain(
            'GROUPED_OR_VARIETY_ADVERTISEMENT',
        );
    });

    it('does not assign a shared Dove size', () => {
        const result = attributeIdentityEvidence({
            advertisementName:
                'Dove or Dove Men+Care shampoo or conditioner',
            advertisementBrand: 'Dove',
            advertisementDescription:
                'Each. Selected varieties. 530 mL.',
            candidateName: 'shampoo',
            relatedVariantCount: 0,
        });

        expect(result.eligibleForMatching).toBe(false);
        expect(result.quantityValue).toBeNull();
    });

    it('blocks mixed Food Saver products', () => {
        const result = attributeIdentityEvidence({
            advertisementName:
                'FOOD SAVER VACUUM SEALERS OR ROLLS',
            advertisementBrand: 'Foodsaver',
            advertisementDescription: 'SELECTED VARIETIES',
            candidateName: 'ROLLS',
            relatedVariantCount: 0,
        });

        expect(result.eligibleForMatching).toBe(false);
    });

    it('does not invent Western Family package size', () => {
        const result = attributeIdentityEvidence({
            advertisementName: 'Western Family Parchment Paper',
            advertisementBrand: null,
            advertisementDescription: 'or Wax, Selected Varieties',
            candidateName: 'Western Family Parchment Paper',
            relatedVariantCount: 0,
        });

        expect(result.quantityValue).toBeNull();
        expect(result.eligibleForMatching).toBe(false);
    });


    it('attributes 750 g specifically to Rogers Granola', () => {
        const result = attributeIdentityEvidence({
            advertisementName: 'Rogers Granola',
            advertisementBrand: 'ROGERS',
            advertisementDescription:
                '(750g) or Oats (1kg), Selected Varieties',
            candidateName: 'Rogers Granola',
            relatedVariantCount: 0,
        });

        expect(result.quantityValue).toBe(750);
        expect(result.quantityUnit).toBe('g');
        expect(result.packageEvidence).toBe(
            'EXACT_PAIRED_DESCRIPTION',
        );
        expect(result.brand).toBeNull();
        expect(result.eligibleForMatching).toBe(false);
    });

    it('attributes 1 kg specifically to Oats', () => {
        const result = attributeIdentityEvidence({
            advertisementName: 'Rogers Granola',
            advertisementBrand: 'ROGERS',
            advertisementDescription:
                '(750g) or Oats (1kg), Selected Varieties',
            candidateName: 'Oats',
            relatedVariantCount: 0,
        });

        expect(result.quantityValue).toBe(1);
        expect(result.quantityUnit).toBe('kg');
        expect(result.packageEvidence).toBe(
            'EXACT_PAIRED_DESCRIPTION',
        );
        expect(result.brand).toBeNull();
        expect(result.eligibleForMatching).toBe(false);
    });

});
