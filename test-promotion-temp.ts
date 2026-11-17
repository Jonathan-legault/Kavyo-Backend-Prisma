import { parsePromotion } from "./src/flyers/normalization/promotion.ts";

const result = parsePromotion({
  productName: "Sausage Meat",
  descriptionText: "375 g 7.99 ea",
  priceText: "ea when you buy 2 or more",
  saleStory: null,
  disclaimerText: null,
  itemPrice: 6,
  regularPriceAmount: null,
  currentPriceRange: null,
  originalPriceRange: null,
  inStoreOnly: null,
});

console.log(JSON.stringify(result, null, 2));
