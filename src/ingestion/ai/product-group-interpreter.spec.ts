
import { describe, expect, it } from 'vitest';
import {
    validateProductGroups,
} from './product-group-interpreter.js';

describe('product group validation', () => {
    it('accepts two groups explicitly present in the source', () => {
        const result = validateProductGroups(
            'Individual Chicken Pot Pies or Sausages',
            ['Individual Chicken Pot Pies', 'Sausages'],
        );

        expect(result.validGroups).toEqual([
            'Individual Chicken Pot Pies',
            'Sausages',
        ]);
        expect(result.rejectedGroups).toEqual([]);
    });

    it('rejects invented product descriptions', () => {
        const result = validateProductGroups(
            'Individual Chicken Pot Pies or Sausages',
            ['Individual Chicken Pot Pies', 'Premium Pork Sausages'],
        );

        expect(result.validGroups).toEqual([
            'Individual Chicken Pot Pies',
        ]);
        expect(result.rejectedGroups).toEqual([
            'Premium Pork Sausages',
        ]);
    });

    it('rejects duplicate product groups', () => {
        const result = validateProductGroups(
            'Pulled Chicken or Pork',
            ['Pulled Chicken', 'Pulled Chicken', 'Pork'],
        );

        expect(result.validGroups).toEqual([
            'Pulled Chicken',
            'Pork',
        ]);
        expect(result.warnings).toContain(
            'Duplicate product group: "Pulled Chicken"',
        );
    });

    it('rejects an unsupported brand-product combination', () => {
        const result = validateProductGroups(
            'Individual Chicken Pot Pies or Sausages',
            ['Marcangelo Chicken Pot Pies', 'Sausages'],
        );

        expect(result.rejectedGroups).toEqual([
            'Marcangelo Chicken Pot Pies',
        ]);
        expect(result.validGroups).toEqual(['Sausages']);
    });
});
