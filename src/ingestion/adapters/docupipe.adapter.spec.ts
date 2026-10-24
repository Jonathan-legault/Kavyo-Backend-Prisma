
import { describe, expect, it } from 'vitest';
import { adaptDocuPipeGrouping } from './docupipe.adapter.js';

describe('adaptDocuPipeGrouping', () => {
  it('converts one lobster advertisement into two offers', () => {
    const result = adaptDocuPipeGrouping(
      {
        offerTitle: 'Atlantic Canada Lobster Tail',
        pageNumber: 1,
        promotionConditions: null,
        scenePointsOffer: null,
        scenePointsCondition: null,
        eligibleProducts: [
          {
            productName: 'Atlantic Canada Lobster Tail',
            brand: null,
            advertisedPrice: '$7.99 ea',
            numericPrice: 7.99,
            priceUnit: 'each',
            packageSize: '3-4 oz 85 g',
            equivalentPrice: null,
          },
          {
            productName: 'Large Lobster Tail',
            brand: null,
            advertisedPrice: '$16.99 ea',
            numericPrice: 16.99,
            priceUnit: 'each',
            packageSize: '6-7 oz',
            equivalentPrice: null,
          },
        ],
      },
      {
        documentId: 'safeway-oct22-2026',
        groupIndex: 6,
        retailerName: 'Sobeys / Safeway',
        region: 'WST_AB_MB_SK',
        observedAt: '2026-10-22T18:00:00.000Z',
        validFrom: '2026-10-22',
        validUntil: '2026-10-28',
      },
    );

    expect(result).toHaveLength(2);

    expect(result[0].salePrice).toBe(7.99);
    expect(result[1].salePrice).toBe(16.99);

    expect(result[0].quantityText).toBe('3-4 oz 85 g');
    expect(result[1].quantityText).toBe('6-7 oz');

    expect(result[0].sourceRecordId)
      .toBe('safeway-oct22-2026:p1:g7:i1');

    expect(result[1].sourceRecordId)
      .toBe('safeway-oct22-2026:p1:g7:i2');

    expect(result[0].reviewRequired).toBe(true);
    expect(result[1].reviewRequired).toBe(true);
  });



    it('preserves a multibuy offer without inventing a unit price', () => {
    const result = adaptDocuPipeGrouping(
        {
        offerTitle: 'Raspberries',
        pageNumber: 1,
        promotionConditions: null,
        scenePointsOffer: null,
        scenePointsCondition: null,
        eligibleProducts: [
            {
            productName: 'Raspberries',
            brand: null,
            advertisedPrice: '2/$5',
            numericPrice: null,
            priceUnit: null,
            packageSize: '170 g',
            equivalentPrice: null,
            multibuyQuantity: 2,
            multibuyTotalPrice: 5,
            },
        ],
        },
        {
        documentId: 'safeway-oct22-2026',
        groupIndex: 2,
        retailerName: 'Sobeys / Safeway',
        region: 'WST_AB_MB_SK',
        observedAt: '2026-10-22T18:00:00.000Z',
        validFrom: '2026-10-22',
        validUntil: '2026-10-28',
        },
    );

    expect(result).toHaveLength(1);
    expect(result[0].salePrice).toBeUndefined();
    expect(result[0].promotionText).toContain('2/$5');
    expect(result[0].promotionText).toContain('Multibuy: 2 for $5.00');
    expect(result[0].reviewReasons).toContain('MULTIBUY_REQUIRES_REVIEW');
    });


  it('preserves Scene+ rewards separately from the product price', () => {
    const result = adaptDocuPipeGrouping(
      {
        offerTitle: 'KRAFT Peanut Butter',
        pageNumber: 1,
        promotionConditions: null,
        scenePointsOffer: '150 PTS',
        scenePointsCondition: 'when you buy 3',
        eligibleProducts: [
          {
            productName: 'KRAFT Peanut Butter',
            brand: 'KRAFT',
            advertisedPrice: '$4.97 ea',
            numericPrice: 4.97,
            priceUnit: 'each',
            packageSize: '750 g-1 kg',
            equivalentPrice: null,
          },
        ],
      },
      {
        documentId: 'safeway-oct22-2026',
        groupIndex: 8,
        retailerName: 'Sobeys / Safeway',
        region: 'WST_AB_MB_SK',
        observedAt: '2026-10-22T18:00:00.000Z',
        validFrom: '2026-10-22',
        validUntil: '2026-10-28',
      },
    );

    expect(result).toHaveLength(1);

    // The advertised product price remains unchanged.
    expect(result[0].salePrice).toBe(4.97);

    // Loyalty information is stored separately.
    expect(result[0].loyaltyProgram).toBe('Scene+');
    expect(result[0].loyaltyPoints).toBe(150);
    expect(result[0].loyaltyCondition).toBe('when you buy 3');

    // Still an unverified product candidate.
    expect(result[0].reviewRequired).toBe(true);
  });


  it('preserves an advertised price with an unknown unit', () => {
    const result = adaptDocuPipeGrouping(
      {
        offerTitle: 'MARIGOLD Sauces',
        pageNumber: 22,
        promotionConditions: null,
        scenePointsOffer: null,
        scenePointsCondition: null,
        eligibleProducts: [
          {
            productName: 'MARIGOLD Sauces',
            brand: 'Marigold',
            advertisedPrice: '4.98',
            numericPrice: 4.98,
            priceUnit: null,
            packageSize: '400 mL',
            equivalentPrice: null,
          },
        ],
      },
      {
        documentId: 'safeway-oct22-2026',
        groupIndex: 360,
        retailerName: 'Sobeys / Safeway',
        region: 'WST_AB_MB_SK',
        observedAt: '2026-10-24T18:00:00.000Z',
        validFrom: '2026-10-22',
        validUntil: '2026-10-28',
      },
    );

    expect(result).toHaveLength(1);

    expect(result[0].advertisedPriceText).toBe('4.98');
    expect(result[0].advertisedPriceAmount).toBe(4.98);
    expect(result[0].advertisedPriceUnit).toBeUndefined();

    expect(result[0].salePrice).toBeUndefined();

    expect(result[0].reviewReasons)
      .toContain('PRICE_UNIT_UNKNOWN');
  });


  it('does not treat member-only pricing as a general sale price', () => {
    const result = adaptDocuPipeGrouping(
      {
        offerTitle: 'JANES Pub Style Breaded Chicken or Wings',
        pageNumber: 2,
        promotionConditions: 'MEMBERS SAVE $2',
        scenePointsOffer: null,
        scenePointsCondition: null,
        eligibleProducts: [
          {
            productName: 'JANES Pub Style Breaded Chicken or Wings',
            brand: 'JANES',
            advertisedPrice: '6.99 MEMBER PRICING',
            numericPrice: 6.99,
            priceUnit: 'each',
            packageSize: '660-700 g',
            equivalentPrice: null,
          },
        ],
      },
      {
        documentId: 'safeway-oct22-2026',
        groupIndex: 20,
        retailerName: 'Sobeys / Safeway',
        region: 'WST_AB_MB_SK',
        observedAt: '2026-10-24T20:58:14.213Z',
        validFrom: '2026-10-22',
        validUntil: '2026-10-28',
      },
    );

    expect(result).toHaveLength(1);

    expect(result[0].advertisedPriceAmount).toBe(6.99);
    expect(result[0].memberPrice).toBe(6.99);
    expect(result[0].priceRestriction).toBe('MEMBER_ONLY');

    // Do not publish the member price as a general price.
    expect(result[0].salePrice).toBeUndefined();

    expect(result[0].promotionText).toContain('MEMBERS SAVE $2');

    expect(result[0].reviewReasons)
      .toContain('MEMBER_ONLY_PRICE');
  });


  it('does not treat a starting-at price as an exact sale price', () => {
    const result = adaptDocuPipeGrouping(
      {
        offerTitle: 'Ready For You Soup, Chowder or Chili',
        pageNumber: 2,
        promotionConditions: null,
        scenePointsOffer: '500 PTS',
        scenePointsCondition: 'when you buy 2',
        eligibleProducts: [
          {
            productName: 'Ready For You Soup, Chowder or Chili',
            brand: 'Ready For You',
            advertisedPrice: 'STARTING AT 7.99',
            numericPrice: 7.99,
            priceUnit: 'each',
            packageSize: '625 mL',
            equivalentPrice: null,
          },
        ],
      },
      {
        documentId: 'safeway-oct22-2026',
        groupIndex: 9,
        retailerName: 'Sobeys / Safeway',
        region: 'WST_AB_MB_SK',
        observedAt: '2026-10-24T20:58:14.213Z',
        validFrom: '2026-10-22',
        validUntil: '2026-10-28',
      },
    );

    expect(result).toHaveLength(1);

    // Preserve the advertised minimum.
    expect(result[0].advertisedPriceAmount).toBe(7.99);

    // Do not claim every variety costs $7.99.
    expect(result[0].salePrice).toBeUndefined();

    // Identify the pricing restriction.
    expect(result[0].priceRestriction).toBe('STARTING_AT');

    expect(result[0].reviewReasons)
      .toContain('STARTING_PRICE_REQUIRES_REVIEW');

    // Existing Scene+ functionality must still work.
    expect(result[0].loyaltyPoints).toBe(500);
    expect(result[0].loyaltyCondition).toBe('when you buy 2');
});


it('detects member pricing in promotion conditions', () => {
  const result = adaptDocuPipeGrouping(
    {
      offerTitle: 'PEPSI Soft Drinks 12x355 mL',
      pageNumber: 18,
      promotionConditions:
        'Member price $7.99, $9.49 without Scene+ Card',
      scenePointsOffer: null,
      scenePointsCondition: null,
      eligibleProducts: [
        {
          productName: 'PEPSI Soft Drinks',
          brand: 'Pepsi',
          advertisedPrice: '$7.99',
          numericPrice: 7.99,
          priceUnit: 'each',
          packageSize: '12x355 mL',
          equivalentPrice: null,
        },
      ],
    },
    {
      documentId: 'safeway-oct22-2026',
      groupIndex: 0,
      retailerName: 'Sobeys / Safeway',
      region: 'WST_AB_MB_SK',
      observedAt: '2026-10-24T21:34:05.000Z',
      validFrom: '2026-10-22',
      validUntil: '2026-10-28',
    },
  );

  expect(result).toHaveLength(1);

  expect(result[0].advertisedPriceAmount).toBe(7.99);
  expect(result[0].memberPrice).toBe(7.99);
  expect(result[0].salePrice).toBeUndefined();

  expect(result[0].priceRestriction).toBe('MEMBER_ONLY');

  expect(result[0].reviewReasons)
    .toContain('MEMBER_ONLY_PRICE');

  expect(result[0].promotionText)
    .toContain('$9.49 without Scene+ Card');
});



});
