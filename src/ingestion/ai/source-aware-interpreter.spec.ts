
import { describe, expect, it } from 'vitest';

import {
    validateSourceAwareCandidates,
    type SourceAwareAiOutput,
} from './source-aware-interpreter.js';

describe('source-aware candidate validation', () => {
    it('accepts a directly supported phrase', () => {
        const output: SourceAwareAiOutput = {
            candidates: [{
                sourcePhrase: 'Pulled Chicken',
                sourceField: 'name',
                candidateName: 'Pulled Chicken',
                inheritedWords: [],
                relationship: 'alternative',
            }],
            uncertainties: [],
        };

        const result = validateSourceAwareCandidates(
            { name: 'Pulled Chicken or Pork', description: null },
            output,
        );

        expect(result.candidates[0].status).toBe(
            'SUPPORTED_PHRASE',
        );
    });

    it('retains inherited wording for review', () => {
        const output: SourceAwareAiOutput = {
            candidates: [{
                sourcePhrase: 'Pork',
                sourceField: 'name',
                candidateName: 'Pulled Pork',
                inheritedWords: ['Pulled'],
                relationship: 'alternative',
            }],
            uncertainties: [],
        };

        const result = validateSourceAwareCandidates(
            { name: 'Pulled Chicken or Pork', description: null },
            output,
        );

        expect(result.candidates[0].status).toBe(
            'RECONSTRUCTION_REVIEW',
        );
        expect(result.candidates[0].issues).toEqual([]);
    });

    it('accepts product phrases from the description', () => {
        const output: SourceAwareAiOutput = {
            candidates: [{
                sourcePhrase: 'Block Cheese',
                sourceField: 'description',
                candidateName: 'Block Cheese',
                inheritedWords: [],
                relationship: 'alternative',
            }],
            uncertainties: [],
        };

        const result = validateSourceAwareCandidates(
            {
                name: 'Armstrong Shredded or Sliced Cheese',
                description: '500g and Block Cheese 600g Select varieties',
            },
            output,
        );

        expect(result.candidates[0].status).toBe(
            'SUPPORTED_PHRASE',
        );
    });

    it('rejects wording absent from the source', () => {
        const output: SourceAwareAiOutput = {
            candidates: [{
                sourcePhrase: 'Premium Sausages',
                sourceField: 'name',
                candidateName: 'Premium Sausages',
                inheritedWords: [],
                relationship: 'alternative',
            }],
            uncertainties: [],
        };

        const result = validateSourceAwareCandidates(
            {
                name: 'Armstrong Shredded or Sliced Cheese',
                description: '500g and Block Cheese 600g Select varieties',
            },
            output,
        );

        expect(result.candidates[0].status).toBe('REJECTED');
    });

    it('rejects names containing unsupported extra words', () => {
        const output: SourceAwareAiOutput = {
            candidates: [{
                sourcePhrase: 'Pork',
                sourceField: 'name',
                candidateName: 'Pulled Premium Pork',
                inheritedWords: ['Pulled'],
                relationship: 'alternative',
            }],
            uncertainties: [],
        };

        const result = validateSourceAwareCandidates(
            { name: 'Pulled Chicken or Pork', description: null },
            output,
        );

        expect(result.candidates[0].status).toBe('REJECTED');
    });

    it('rejects duplicate reconstructed names', () => {
        const output: SourceAwareAiOutput = {
            candidates: [
                {
                    sourcePhrase: 'Pulled Chicken',
                    sourceField: 'name',
                    candidateName: 'Pulled Chicken',
                    inheritedWords: [],
                    relationship: 'alternative',
                },
                {
                    sourcePhrase: 'Pulled Chicken',
                    sourceField: 'name',
                    candidateName: 'Pulled Chicken',
                    inheritedWords: [],
                    relationship: 'alternative',
                },
            ],
            uncertainties: [],
        };

        const result = validateSourceAwareCandidates(
            { name: 'Pulled Chicken or Pork', description: null },
            output,
        );

        expect(result.candidates[0].status).toBe(
            'SUPPORTED_PHRASE',
        );
        expect(result.candidates[1].status).toBe('REJECTED');
    });
});
