import { describe, expect, it } from 'vitest';
import { adaptSampleFlyer } from './sample-json.adapter.js';

describe('adaptSampleFlyer', () => {
  it('normalizes a flyer item without inventing a barcode', () => {
    const result = adaptSampleFlyer({
      source: 'KAVYO_SYNTHETIC_FIXTURE',
      postal_code: 't2m 1n7',
      retrieved_at: '2026-10-22T16:00:00.000Z',
      items: [{
        id: 'fixture-001',
        retailer: ' Example Market ',
        name: ' Example Milk ',
        price: 4.99,
        valid_until: '2026-10-29T00:00:00.000Z',
      }],
    });

    expect(result).toHaveLength(1);
    expect(result[0].productName).toBe('Example Milk');
    expect(result[0].retailerName).toBe('Example Market');
    expect(result[0].retrievalPostalCode).toBe('T2M1N7');
    expect(result[0].barcode).toBeUndefined();
    expect(result[0].salePrice).toBe(4.99);
    expect(result[0].reviewRequired).toBe(true);
    expect(result[0].reviewReasons).toContain('BARCODE_MISSING');
  });

  it('flags missing prices and expiry for review', () => {
    const [offer] = adaptSampleFlyer({
      source: 'KAVYO_SYNTHETIC_FIXTURE',
      postal_code: 'T2M1N7',
      retrieved_at: '2026-10-22T16:00:00.000Z',
      items: [{ retailer: 'Example Market', name: 'Example Apples' }],
    });

    expect(offer.reviewReasons).toContain('PRICE_MISSING');
    expect(offer.reviewReasons).toContain('EXPIRY_UNKNOWN');
  });
});
