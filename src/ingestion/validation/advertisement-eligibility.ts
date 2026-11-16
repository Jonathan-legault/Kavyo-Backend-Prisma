export interface AdvertisementEligibilityInput {
  name: string;
  description: string | null;
  currentPrice: string | null;
}

export type AdvertisementEligibility =
  | {
      status: 'REJECT';
      reason:
        | 'PROMOTIONAL_BANNER'
        | 'NAVIGATION_PLACEHOLDER'
        | 'RETAILER_HEADING'
        | 'GENERIC_PROMOTIONAL_HEADING';
    }
  | {
      status: 'CONTINUE';
      reason: null;
    };

export function checkAdvertisementEligibility(
  input: AdvertisementEligibilityInput,
): AdvertisementEligibility {
  const name = input.name.normalize('NFKC').trim();
  const description = (input.description ?? '').trim();
  const hasPrice = Boolean(input.currentPrice?.trim());

  // Explicit Flipp banner labels remain non-product records.
  if (/^banner\s*[-–—:]\s*/i.test(name)) {
    return { status: 'REJECT', reason: 'PROMOTIONAL_BANNER' };
  }

  // Do not reject other records on a keyword alone when a price exists.
  if (hasPrice) {
    return { status: 'CONTINUE', reason: null };
  }

  if (/^(?:direct link|shop now|view all|see all)$/i.test(name)) {
    return { status: 'REJECT', reason: 'NAVIGATION_PLACEHOLDER' };
  }

  // Bare retailer name without supporting product description.
  if (
    !description &&
    /^(?:walmart|real canadian superstore|safeway|sobeys|no frills|save-on-foods|calgary co-op)$/i.test(name)
  ) {
    return { status: 'REJECT', reason: 'RETAILER_HEADING' };
  }

  if (/^(?:always low price|save like a champ|shop the world in our aisles\*?)$/i.test(name)) {
    return { status: 'REJECT', reason: 'GENERIC_PROMOTIONAL_HEADING' };
  }

  if (
    /^(?:toys|electronics|clothing|home decor)$/i.test(name) &&
    (!description || /^(?:a world of toys for less|shop now|see all|view all)$/i.test(description))
  ) {
    return { status: 'REJECT', reason: 'GENERIC_PROMOTIONAL_HEADING' };
  }

  return { status: 'CONTINUE', reason: null };
}
