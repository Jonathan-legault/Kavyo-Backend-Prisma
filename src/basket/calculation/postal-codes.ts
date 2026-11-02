/**
 * Approximate centroids for Calgary forward sortation areas (the first three
 * characters of a Canadian postal code).
 *
 * These values are used only for the prototype's travel-cost estimate. They
 * are not precise door-to-door coordinates. The data was derived from public
 * FSA lookups (GeoNames / zippopotam.us) and is intended to be replaced by a
 * proper geocoder or PostGIS-backed address lookup later.
 */
export interface PostalCodeCentroid {
  latitude: number;
  longitude: number;
}

export const CALGARY_FSA_CENTROIDS: Readonly<
  Record<string, PostalCodeCentroid>
> = {
  T1Y: { latitude: 51.0759, longitude: -114.0015 },
  T2A: { latitude: 51.0402, longitude: -113.9844 },
  T2B: { latitude: 51.0318, longitude: -113.9786 },
  T2C: { latitude: 50.9878, longitude: -114.0001 },
  T2E: { latitude: 51.0632, longitude: -114.0614 },
  T2G: { latitude: 51.0415, longitude: -114.0599 },
  T2H: { latitude: 50.9857, longitude: -114.0631 },
  T2J: { latitude: 50.9693, longitude: -114.0514 },
  T2K: { latitude: 51.0857, longitude: -114.0714 },
  T2L: { latitude: 51.0917, longitude: -114.1127 },
  T2M: { latitude: 51.0696, longitude: -114.0862 },
  T2N: { latitude: 51.0591, longitude: -114.1146 },
  T2P: { latitude: 51.0472, longitude: -114.0802 },
  T2R: { latitude: 51.0426, longitude: -114.0791 },
  T2S: { latitude: 51.0171, longitude: -114.0812 },
  T2T: { latitude: 51.0316, longitude: -114.0994 },
  T2V: { latitude: 50.9909, longitude: -114.074 },
  T2W: { latitude: 50.9604, longitude: -114.1001 },
  T2X: { latitude: 50.9204, longitude: -114.0674 },
  T2Y: { latitude: 50.9093, longitude: -114.0721 },
  T2Z: { latitude: 50.9023, longitude: -113.9873 },
  T3A: { latitude: 51.0922, longitude: -114.1479 },
  T3B: { latitude: 51.0809, longitude: -114.1616 },
  T3C: { latitude: 51.0388, longitude: -114.098 },
  T3E: { latitude: 51.0227, longitude: -114.1342 },
  T3G: { latitude: 51.1147, longitude: -114.1796 },
  T3H: { latitude: 51.0566, longitude: -114.1815 },
  T3J: { latitude: 51.0999, longitude: -113.9422 },
  T3K: { latitude: 51.127, longitude: -114.0787 },
  T3L: { latitude: 51.1162, longitude: -114.2089 },
  T3M: { latitude: 50.8902, longitude: -113.9892 },
  T3N: { latitude: 51.1494, longitude: -114.0019 },
  T3P: { latitude: 51.1793, longitude: -114.1333 },
  T3R: { latitude: 51.1497, longitude: -114.2695 },
  T3S: { latitude: 50.9153, longitude: -113.8932 },
};

export const SUPPORTED_CALGARY_FSA_MESSAGE =
  "Kavyo currently supports Calgary postal codes (FSAs T1Y, T2A-T2Z, and T3A-T3S).";
