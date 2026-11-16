import { describe, expect, it } from 'vitest';
import { checkAdvertisementEligibility } from './advertisement-eligibility.js';

describe('advertisement eligibility', () => {
  const rejectCases = [
    {
      name: 'Banner - Everything for your Diwali glow',
      description: null,
      currentPrice: null,
      reason: 'PROMOTIONAL_BANNER',
    },
    {
      name: 'Banner – Holiday Savings',
      description: null,
      currentPrice: null,
      reason: 'PROMOTIONAL_BANNER',
    },
    {
      name: 'Direct Link',
      description: null,
      currentPrice: null,
      reason: 'NAVIGATION_PLACEHOLDER',
    },
    {
      name: 'Walmart',
      description: null,
      currentPrice: null,
      reason: 'RETAILER_HEADING',
    },
    {
      name: 'REAL CANADIAN SUPERSTORE',
      description: null,
      currentPrice: null,
      reason: 'RETAILER_HEADING',
    },
    {
      name: 'ALWAYS LOW PRICE',
      description: null,
      currentPrice: null,
      reason: 'GENERIC_PROMOTIONAL_HEADING',
    },
    {
      name: 'SAVE LIKE A CHAMP',
      description: 'Score big deals for the big game.',
      currentPrice: null,
      reason: 'GENERIC_PROMOTIONAL_HEADING',
    },
    {
      name: 'TOYS',
      description: 'A world of toys for less',
      currentPrice: null,
      reason: 'GENERIC_PROMOTIONAL_HEADING',
    },
  ] as const;

  it.each(rejectCases)(
    'rejects $name as $reason',
    ({ reason, ...input }) => {
      expect(checkAdvertisementEligibility(input)).toEqual({
        status: 'REJECT',
        reason,
      });
    },
  );

  const continueCases = [
    {
      name: 'Diwali Sweets Assortment',
      description: '500 g',
      currentPrice: '8.99',
    },
    {
      name: 'Western Family Parchment Paper',
      description: null,
      currentPrice: null,
    },
    {
      name: 'Marshmallows',
      description: "250 g or FLEISCHMANN'S Traditional Yeast 3 pk",
      currentPrice: null,
    },
    {
      name: 'Walmart',
      description: 'Assorted grocery products 500 g',
      currentPrice: null,
    },
    {
      name: 'TOYS',
      description: 'Specific product listing',
      currentPrice: null,
    },
    {
      name: 'Direct Link',
      description: null,
      currentPrice: '5.99',
    },
  ];

  it.each(continueCases)(
    'preserves $name with its supplied evidence',
    input => {
      expect(checkAdvertisementEligibility(input)).toEqual({
        status: 'CONTINUE',
        reason: null,
      });
    },
  );
});
