
import { adaptDocuPipeGrouping } from '../adapters/docupipe.adapter.js';
import type { DocuPipeOfferGrouping } from '../adapters/docupipe.adapter.js';
import type { NormalizedOffer } from '../contracts/normalized-offer.js';

export interface DocuPipeFlyer {
  storeName: string;
  region: string;
  flyerPeriod: {
    startDate: string | null;
    endDate: string | null;
  };
  offerGroupings: DocuPipeOfferGrouping[];
}

export interface BatchReport {
  totalGroups: number;
  totalCandidates: number;
  requiringReview: number;
  unknownPriceUnits: number;
  withoutSingleItemPrice: number;
}

export function processSafewayBatches(
  first: DocuPipeFlyer,
  second: DocuPipeFlyer,
  documentId: string,
  observedAt: string,
): { offers: NormalizedOffer[]; report: BatchReport } {
  if (first.storeName !== second.storeName) {
    throw new Error('Flyer retailer mismatch');
  }

  if (!first.flyerPeriod.startDate || !first.flyerPeriod.endDate) {
    throw new Error('Missing primary flyer dates');
  }

  if (
    first.offerGroupings.some(
      (group) => group.pageNumber < 1 || group.pageNumber > 20,
    ) ||
    second.offerGroupings.some(
      (group) => group.pageNumber < 1 || group.pageNumber > 4,
    )
  ) {
    throw new Error('Unexpected flyer page number');
  }

  // Second extraction starts at original flyer page 19.
  // Pages 1-2 overlap the first extraction.
  const additionalGroups = second.offerGroupings
    .filter((group) => group.pageNumber >= 3)
    .map((group) => ({
      ...group,
      pageNumber: group.pageNumber + 18,
    }));

  const allGroups = [
    ...first.offerGroupings,
    ...additionalGroups,
  ];

  const offers = allGroups.flatMap((group, groupIndex) =>
    adaptDocuPipeGrouping(group, {
      documentId,
      groupIndex,
      retailerName: first.storeName,
      region: first.region,
      observedAt,
      validFrom: first.flyerPeriod.startDate!,
      validUntil: first.flyerPeriod.endDate!,
    }),
  );

  const report: BatchReport = {
    totalGroups: allGroups.length,
    totalCandidates: offers.length,
    requiringReview: offers.filter((offer) => offer.reviewRequired).length,
    unknownPriceUnits: offers.filter((offer) =>
      offer.reviewReasons.includes('PRICE_UNIT_UNKNOWN'),
    ).length,
    withoutSingleItemPrice: offers.filter(
      (offer) => offer.salePrice === undefined,
    ).length,
  };

  return { offers, report };
}
