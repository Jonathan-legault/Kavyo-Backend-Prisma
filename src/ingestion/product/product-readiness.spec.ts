import { describe, expect, it } from 'vitest';
import { assessProductReadiness, verifiedGtin } from './product-readiness.js';

describe('product preflight', () => {
  it('validates a standard GTIN and rejects a mistyped code', () => {
    expect(verifiedGtin('036000291452')).toBe('036000291452');
    expect(verifiedGtin('036000291453')).toBeNull();
    expect(verifiedGtin('FLIPP123')).toBeNull();
  });
  it('does not require a price for a canonical product', () => {
    expect(assessProductReadiness({productName:'Rice', brand:'Example', quantityValue:500, quantityUnit:'g'}).status).toBe('READY_FOR_MATCH');
  });
  it('never promotes ambiguous group offers', () => {
    const x=assessProductReadiness({productName:'Assorted Juice', brand:'Example', quantityValue:1, quantityUnit:'L',isMultiVariant:true});
    expect(x).toMatchObject({status:'REVIEW'});
    expect(x.reasons).toContain('GROUPED_PRODUCT_VARIANTS');
  });
  it('requires package identity for barcode-free automatic matching', () => {
    expect(assessProductReadiness({productName:'Milk',brand:'Example'}).reasons).toContain('PACKAGE_IDENTITY_MISSING');
  });
  it('rejects missing identity', () => {
    expect(assessProductReadiness({productName:''}).status).toBe('REJECT');
  });
});
