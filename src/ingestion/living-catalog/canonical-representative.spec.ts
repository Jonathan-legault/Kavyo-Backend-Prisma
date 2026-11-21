import { describe, expect, it } from 'vitest';
import { selectCanonicalRepresentative, type SourcedProductCandidate } from './canonical-representative.js';

const base: SourcedProductCandidate = {
  decision: 'CANDIDATE',
  offerId: 'random-offer-uuid-a',
  stagedOfferId: 'random-stage-uuid-a',
  fingerprint: 'same-fingerprint',
  productName: 'Temptations Cat Treats',
  brand: 'WHISKAS®',
  quantityText: '454 g',
  quantityValue: '454',
  quantityUnit: 'g',
  scopeCategory: 'PET',
  sourceRecordId: '1053874800',
  flyerExternalId: '8226976',
  marketKey: 'T2A4T8',
};

describe('canonical representative selection', () => {
  it('selects the same literal source row regardless of randomized UUIDs and insertion order', () => {
    const second: SourcedProductCandidate = {
      ...base, offerId: 'random-offer-uuid-b', stagedOfferId: 'random-stage-uuid-b',
      brand: 'Whiskas', sourceRecordId: '1054000538', flyerExternalId: '8227115',
    };
    expect(selectCanonicalRepresentative([second, base]).sourceRecordId).toBe('1053874800');
    expect(selectCanonicalRepresentative([base, second]).brand).toBe('WHISKAS®');
    const reseeded = [
      { ...base, offerId: 'new-uuid-z', stagedOfferId: 'new-stage-z' },
      { ...second, offerId: 'new-uuid-a', stagedOfferId: 'new-stage-a' },
    ];
    expect(selectCanonicalRepresentative(reseeded).brand).toBe('WHISKAS®');
  });

  it('breaks a shared source record ID tie using flyer and market identifiers', () => {
    const other = { ...base, flyerExternalId: '8227000', marketKey: 'T3A', offerId: 'other' };
    expect(selectCanonicalRepresentative([other, base])).toBe(base);
  });

  it('uses literal canonical values to break otherwise matching identity keys', () => {
    const other = { ...base, brand: 'Whiskas', offerId: 'other' };
    expect(selectCanonicalRepresentative([other, base]).brand).toBe('WHISKAS®');
  });

  it('rejects missing or indistinguishable source identity instead of choosing randomly', () => {
    expect(() => selectCanonicalRepresentative([])).toThrow();
    expect(() => selectCanonicalRepresentative([{ ...base, sourceRecordId: '' }])).toThrow();
    expect(() => selectCanonicalRepresentative([base, { ...base, offerId: 'different' }])).toThrow();
  });

  it('never mutates candidate order', () => {
    const other = { ...base, sourceRecordId: '1054000538', offerId: 'other' };
    const candidates = [other, base];
    selectCanonicalRepresentative(candidates);
    expect(candidates).toEqual([other, base]);
  });
});
