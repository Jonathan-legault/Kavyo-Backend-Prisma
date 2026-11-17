import { normalizeFlyerOffer } from "./src/flyers/normalization/flyer-normalizer.ts";

const result = normalizeFlyerOffer({
  retailerName: "Safeway",

  flyer: {
    id: 8205958,
    flyer_run_id: 0,
    name: "Safeway Flyer",
    merchant: "Safeway",
    merchant_id: 0,
    valid_from: "2026-10-29T03:00:00-04:00",
    valid_to: "2026-11-04T23:59:59-05:00",
  },

  item: {
    id: 1049922614,
    flyer_id: 8205958,
    name: "Sausage Meat",
    brand: "Johnsonville",
    price: "6.0",
    valid_from: "2026-10-29T03:00:00-04:00",
    valid_to: "2026-11-04T23:59:59-05:00",
  },

  detail: {
    id: 1049922614,
    flyer_id: 8205958,
    name: "Sausage Meat",
    description: "375 g 7.99 ea",
    price_text: "ea when you buy 2 or more",
    sale_story: null,
    disclaimer_text: null,
    sku: null,
    current_price_range: null,
    original_price_range: null,
    in_store_only: false,
  },
});

console.log(JSON.stringify({
  productName: result.productName,
  advertisedPriceText: result.advertisedPriceText,
  advertisedPriceAmount: result.advertisedPriceAmount,
  isMultibuy: result.isMultibuy,
  promotionType: result.promotionType,
  promotionQuantity: result.promotionQuantity,
  promotionTotalPrice: result.promotionTotalPrice,
  promotionUnitPrice: result.promotionUnitPrice,
  promotionText: result.promotionText,
  promotionConditions: result.promotionConditions,
  reviewReasons: result.reviewReasons,
  status: result.status,
}, null, 2));
