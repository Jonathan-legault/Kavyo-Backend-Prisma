
import { describe, expect, it } from 'vitest';
import {
    validateOffer,
    type OfferValidationInput,
} from './offer-validator.js';

const validOffer: OfferValidationInput = {
    productName: 'KRAFT Peanut Butter',
    brand: 'KRAFT',
    retailerName: 'Safeway',
    advertisedPriceAmount: 4.97,
    quantityValue: 500,
    quantityUnit: 'g',
    unitPrice: 0.994,
    unitPriceBasis: '100g',
};

describe('validateOffer', () => {
    it('accepts an offer meeting the six criteria', () => {
        const result = validateOffer(validOffer);

        expect(result.accepted).toBe(true);
        expect(result.reviewRequired).toBe(false);
        expect(result.reasons).toEqual([]);
    });

    it('rejects an offer without a product name', () => {
        const result = validateOffer({
            ...validOffer,
            productName: '',
        });

        expect(result.reasons).toContain('PRODUCT_NAME_MISSING');
    });

    it('rejects a missing price', () => {
        const result = validateOffer({
            ...validOffer,
            advertisedPriceAmount: null,
        });

        expect(result.reasons).toContain('PRICE_MISSING');
    });

    it('requires interpretable quantity information', () => {
        const result = validateOffer({
            ...validOffer,
            quantityValue: null,
            quantityUnit: null,
            unitPrice: null,
        });

        expect(result.reasons).toContain('QUANTITY_UNIT_MISSING');
    });

    it('requires a unit price or calculable price basis', () => {
        const result = validateOffer({
            ...validOffer,
            quantityValue: null,
            unitPrice: null,
            advertisedPriceUnit: null,
        });

        expect(result.reasons).toContain('UNIT_PRICE_UNAVAILABLE');
    });

    it('rejects a missing retailer', () => {
        const result = validateOffer({
            ...validOffer,
            retailerName: '',
        });

        expect(result.reasons).toContain('RETAILER_MISSING');
    });

    it('requires store identification when applicable', () => {
        const result = validateOffer({
            ...validOffer,
            storeIdentificationRequired: true,
            storeIdentifier: null,
        });

        expect(result.reasons).toContain(
            'STORE_IDENTIFICATION_MISSING',
        );
    });

    it('does not require a UPC or SKU', () => {
        const result = validateOffer(validOffer);

        expect(result.accepted).toBe(true);
        expect(result.reasons).not.toContain('BARCODE_MISSING');
        expect(result.reasons).not.toContain('NO_GTIN');
    });

    it('preserves membership and minimum-purchase conditions', () => {
        const result = validateOffer({
            ...validOffer,
            isMemberPrice: true,
            minimumPurchaseQuantity: 3,
            loyaltyCondition: 'Scene+ card required',
        });

        expect(result.accepted).toBe(true);
        expect(result.offerComment).toContain(
            'Membership conditions apply',
        );
        expect(result.offerComment).toContain('Minimum purchase: 3');
        expect(result.offerComment).toContain('Scene+ card required');
    });

    it('preserves multibuy conditions without automatic rejection', () => {
        const result = validateOffer({
            ...validOffer,
            isMultibuy: true,
            promotionText: '2 for $8',
        });

        expect(result.accepted).toBe(true);
        expect(result.offerComment).toContain('2 for $8');
        expect(result.offerComment).toContain('Multibuy promotion');
    });

    it('does not require a brand for generic products', () => {
        const result = validateOffer({
            ...validOffer,
            productName: 'Fresh Bananas',
            brand: null,
        });

        expect(result.accepted).toBe(true);
    });


    it('requires review for an approximate package size', () => {
        const result = validateOffer({
            ...validOffer,
            quantityIsApproximate: true,
            isPriceRange: true,
        });

        expect(result.accepted).toBe(false);
        expect(result.reviewRequired).toBe(true);
        expect(result.reasons).toContain('PACKAGE_SIZE_RANGE');
    });

});
