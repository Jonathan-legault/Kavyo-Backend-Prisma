
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  processSafewayBatches,
  type DocuPipeFlyer,
} from '../src/ingestion/processors/docupipe-batch.processor.js';

function loadFlyer(filename: string): DocuPipeFlyer {
  const filePath = resolve('data', 'raw', filename);
  const content = readFileSync(filePath, 'utf8');

  return JSON.parse(content) as DocuPipeFlyer;
}


const first = loadFlyer('Safeway_oct_22_weeklyflyer.json');

const second = loadFlyer('Safeway_oct_22_weeklyflyer-p1-4.json');


const { offers, report } = processSafewayBatches(
  first,
  second,
  'safeway-oct22-2026',
  new Date().toISOString(),
);

console.log('\n=== KAVYO SAFEWAY INGESTION REPORT ===\n');

console.table(report);


console.log('\n=== PRICE CLASSIFICATION ===\n');

const priceClassification = {
  unrestrictedEachPriceCandidates: offers.filter(
    (offer) => offer.salePrice !== undefined,
  ).length,

  memberOnlyPrices: offers.filter(
    (offer) => offer.priceRestriction === 'MEMBER_ONLY',
  ).length,

  startingAtPrices: offers.filter(
    (offer) => offer.priceRestriction === 'STARTING_AT',
  ).length,

  multibuyOffers: offers.filter((offer) =>
    offer.reviewReasons.includes('MULTIBUY_REQUIRES_REVIEW'),
  ).length,

  weightBasedOffers: offers.filter((offer) =>
    ['per lb', 'per kg', 'per 100 g'].includes(
      offer.advertisedPriceUnit ?? '',
    ),
  ).length,

  unknownPriceUnits: offers.filter(
    (offer) => offer.advertisedPriceUnit === undefined,
  ).length,

  unknownUnitsWithNumericPrice: offers.filter(
    (offer) =>
      offer.advertisedPriceUnit === undefined &&
      offer.advertisedPriceAmount !== undefined,
  ).length,

  minimumPurchaseOffers: offers.filter(
    (offer) => offer.minimumPurchaseQuantity !== undefined,
  ).length,};

console.table(priceClassification);


console.table(priceClassification);

console.log('\n=== MINIMUM PURCHASE OFFERS ===\n');

console.table(
  offers
    .filter((offer) => offer.minimumPurchaseQuantity !== undefined)
    .map((offer) => ({
      productName: offer.productName,
      advertisedPriceText: offer.advertisedPriceText,
      minimumPurchaseQuantity: offer.minimumPurchaseQuantity,
      salePrice: offer.salePrice,
    })),
);


console.log('\n=== PRICES WITH UNKNOWN UNITS ===\n');

console.table(
  offers
    .filter(
      (offer) =>
        offer.advertisedPriceAmount !== undefined &&
        offer.advertisedPriceUnit === undefined,
    )
    .map((offer) => ({
      recordId: offer.sourceRecordId,
      product: offer.productName,
      priceText: offer.advertisedPriceText,
      amount: offer.advertisedPriceAmount,
      promotion: offer.promotionText?.slice(0, 150),
    })),
);


console.log('\n=== PRICE UNIT DISTRIBUTION ===\n');

const priceUnits: Record<string, number> = {};

for (const offer of offers) {
  const unit = offer.advertisedPriceUnit ?? 'UNKNOWN';
  priceUnits[unit] = (priceUnits[unit] ?? 0) + 1;
}

console.table(priceUnits);

console.log('\n=== SAMPLE NORMALIZED OFFERS ===\n');

console.log(JSON.stringify(offers.slice(0, 3), null, 2));

console.log('\nNo database writes performed.');
