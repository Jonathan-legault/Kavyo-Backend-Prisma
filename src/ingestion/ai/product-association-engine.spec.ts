
import { describe, expect, it } from 'vitest';

import {
    associateProductBrands,
    extractBrandAlternatives,
} from './product-association-engine.js';

import type {
    ValidatedCandidate,
} from './source-aware-interpreter.js';

function candidate(
    name: string,
    field: 'name' | 'description' = 'name',
    status: ValidatedCandidate['status'] = 'SUPPORTED_PHRASE',
): ValidatedCandidate {
    return {
        sourcePhrase: name,
        sourceField: field,
        candidateName: name,
        inheritedWords: [],
        relationship: 'alternative',
        status,
        issues: [],
    };
}

describe('product association engine', () => {
    it('parses distinct brand alternatives', () => {
        expect(
            extractBrandAlternatives('SWISS CHALET | MARCANGELO'),
        ).toEqual(['SWISS CHALET', 'MARCANGELO']);

        expect(
            extractBrandAlternatives('Brand1 or Brand2'),
        ).toEqual(['Brand1', 'Brand2']);
    });

    it('proposes positional brand associations for Sobeys', () => {
        const result = associateProductBrands(
            {
                name: 'Individual Chicken Pot Pies or Sausages',
                brandText: 'SWISS CHALET | MARCANGELO',
            },
            [
                candidate('Individual Chicken Pot Pies'),
                candidate('Sausages'),
            ],
        );

        expect(result.proposedAssociations).toHaveLength(2);

        expect(
            result.proposedAssociations.map(
                (association) => [
                    association.brand,
                    association.candidateName,
                ],
            ),
        ).toEqual([
            ['SWISS CHALET', 'Individual Chicken Pot Pies'],
            ['MARCANGELO', 'Sausages'],
        ]);

        expect(
            result.proposedAssociations.every(
                (association) =>
                    association.status === 'HYPOTHESIS_REVIEW',
            ),
        ).toBe(true);

        expect(result.eligibleForAutomaticPromotion).toBe(false);
    });

    it('does not assign a single brand across multiple groups', () => {
        const result = associateProductBrands(
            {
                name: 'Natural Shredded Chicken or Breakfast Sausages',
                brandText: 'Maple Leaf',
            },
            [
                candidate('Natural Shredded Chicken'),
                candidate('Breakfast Sausages'),
            ],
        );

        expect(result.proposedAssociations).toEqual([]);
        expect(result.unresolvedBrands).toEqual(['Maple Leaf']);
    });

    it('does not pair when brand and product counts differ', () => {
        const result = associateProductBrands(
            {
                name: 'Cheese or Sausages or Chicken',
                brandText: 'Brand1 | Brand2',
            },
            [
                candidate('Cheese'),
                candidate('Sausages'),
                candidate('Chicken'),
            ],
        );

        expect(result.proposedAssociations).toEqual([]);
        expect(result.unresolvedProducts).toHaveLength(3);
    });

    it('blocks positional pairing across source fields', () => {
        const result = associateProductBrands(
            {
                name: 'Cheese',
                brandText: 'Brand1 | Brand2',
            },
            [
                candidate('Cheese'),
                candidate('Sausages', 'description'),
            ],
        );

        expect(result.proposedAssociations).toEqual([]);
    });

    it('blocks pairing when an AI candidate was rejected', () => {
        const result = associateProductBrands(
            {
                name: 'Cheese or Sausages',
                brandText: 'Brand1 | Brand2',
            },
            [
                candidate('Cheese'),
                candidate('Sausages', 'name', 'REJECTED'),
            ],
        );

        expect(result.proposedAssociations).toEqual([]);
    });

    it('blocks incorrect product ordering', () => {
        const result = associateProductBrands(
            {
                name: 'Cheese or Sausages',
                brandText: 'Brand1 | Brand2',
            },
            [
                candidate('Sausages'),
                candidate('Cheese'),
            ],
        );

        expect(result.proposedAssociations).toEqual([]);
    });
});
