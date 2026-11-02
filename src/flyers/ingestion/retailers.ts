export interface FlyerRetailerConfig {
  merchantId: number;
  name: string;
  website: string;
}

export const FLYER_SOURCE_SYSTEM_NAME = "FLIPP_FLYERS";
export const FLYER_SOURCE_BASE_URL = "https://flipp.com";

export const FLYER_RETAILERS: FlyerRetailerConfig[] = [
  {
    merchantId: 2126,
    name: "Safeway",
    website: "https://www.safeway.ca",
  },
  {
    merchantId: 234,
    name: "Walmart",
    website: "https://www.walmart.ca",
  },
  {
    merchantId: 2051,
    name: "Calgary Co-op",
    website: "https://www.calgarycoop.com",
  },
];

export function findFlyerRetailerByMerchantId(
  merchantId: number,
): FlyerRetailerConfig | undefined {
  return FLYER_RETAILERS.find(
    (retailer) => retailer.merchantId === merchantId,
  );
}
