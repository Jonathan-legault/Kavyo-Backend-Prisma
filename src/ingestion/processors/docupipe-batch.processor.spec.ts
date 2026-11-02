
import { describe, expect, it } from 'vitest';
import { processSafewayBatches } from './docupipe-batch.processor.js';
import type { DocuPipeFlyer } from './docupipe-batch.processor.js';

function makeGroup(pageNumber: number, name: string) {
  return {
    offerTitle: name,
    pageNumber,
    promotionConditions: null,
    scenePointsOffer: null,
    scenePointsCondition: null,
    eligibleProducts: [
      {
        productName: name,
        brand: null,
        advertisedPrice: '$2.00 ea',
        numericPrice: 2,
        priceUnit: 'each',
        packageSize: null,
        equivalentPrice: null,
      },
    ],
  };
}

describe('processSafewayBatches', () => {
  it('removes overlapping pages and preserves original page numbers', () => {
    const first: DocuPipeFlyer = {
      storeName: 'Sobeys / Safeway',
      region: 'WST_AB_MB_SK',
      flyerPeriod: {
        startDate: '2026-10-22',
        endDate: '2026-10-28',
      },
      offerGroupings: [
        makeGroup(19, 'Original page 19'),
        makeGroup(20, 'Original page 20'),
      ],
    };

    const second: DocuPipeFlyer = {
      storeName: 'Sobeys / Safeway',
      region: 'V02_SBY_WK26_DIG_VENDOR_WST_AB_MB_SK',
      flyerPeriod: {
        startDate: null,
        endDate: null,
      },
      offerGroupings: [
        makeGroup(1, 'Duplicate page 19'),
        makeGroup(2, 'Duplicate page 20'),
        makeGroup(3, 'New page 21'),
        makeGroup(4, 'New page 22'),
      ],
    };

    const result = processSafewayBatches(
      first,
      second,
      'safeway-oct22-2026',
      '2026-10-24T18:00:00.000Z',
    );

    expect(result.report.totalGroups).toBe(4);
    expect(result.report.totalCandidates).toBe(4);

    expect(result.offers.map((offer) => offer.productName)).toEqual([
      'Original page 19',
      'Original page 20',
      'New page 21',
      'New page 22',
    ]);

    expect(result.offers[2].sourceRecordId)
      .toBe('safeway-oct22-2026:p21:g3:i1');

    expect(result.offers[3].sourceRecordId)
      .toBe('safeway-oct22-2026:p22:g4:i1');

    expect(result.offers[3].validUntil).toBe('2026-10-28');
  });
});
