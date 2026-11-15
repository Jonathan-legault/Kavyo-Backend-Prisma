
export interface AdvertisementEligibilityInput {
  name: string;
  description: string | null;
  currentPrice: string | null;
}

export type AdvertisementEligibility =
  | {
      status: 'REJECT';
      reason: 'PROMOTIONAL_BANNER';
    }
  | {
      status: 'CONTINUE';
      reason: null;
    };

export function checkAdvertisementEligibility(
  input: AdvertisementEligibilityInput,
): AdvertisementEligibility {
  const name = input.name.trim();

  // Explicit Flipp promotional-banner label.
  // Do not reject based on holidays, cultures,
  // promotional themes, or price absence alone.
  if (/^banner\s*[-–—:]\s*/i.test(name)) {
    return {
      status: 'REJECT',
      reason: 'PROMOTIONAL_BANNER',
    };
  }

  return {
    status: 'CONTINUE',
    reason: null,
  };
}
