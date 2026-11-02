export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface TravelOptions {
  /** Marginal driving cost in CAD per billed kilometre. */
  travelCostPerKm?: number;
  /** Bill the drive home as well as the drive to the store. */
  roundTrip?: boolean;
  /** Multiplier used to approximate road distance from straight-line distance. */
  roadDistanceFactor?: number;
  /** Used only to give the user an approximate trip time. */
  averageSpeedKmH?: number;
}

export interface ResolvedTravelOptions {
  travelCostPerKm: number;
  roundTrip: boolean;
  roadDistanceFactor: number;
  averageSpeedKmH: number;
}

export interface TravelEstimate {
  straightLineDistanceKm: number;
  roadDistanceKm: number;
  billedDistanceKm: number;
  travelCost: number;
  estimatedTravelMinutes: number;
  roundTrip: boolean;
  travelCostPerKm: number;
  roadDistanceFactor: number;
  averageSpeedKmH: number;
}

export const DEFAULT_TRAVEL_OPTIONS: ResolvedTravelOptions = {
  travelCostPerKm: 0.35,
  roundTrip: true,
  roadDistanceFactor: 1.3,
  averageSpeedKmH: 35,
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function resolveTravelOptions(
  options: TravelOptions = {},
): ResolvedTravelOptions {
  return {
    travelCostPerKm:
      options.travelCostPerKm ?? DEFAULT_TRAVEL_OPTIONS.travelCostPerKm,
    roundTrip: options.roundTrip ?? DEFAULT_TRAVEL_OPTIONS.roundTrip,
    roadDistanceFactor:
      options.roadDistanceFactor ?? DEFAULT_TRAVEL_OPTIONS.roadDistanceFactor,
    averageSpeedKmH:
      options.averageSpeedKmH ?? DEFAULT_TRAVEL_OPTIONS.averageSpeedKmH,
  };
}

/**
 * Great-circle distance in kilometres. The result is multiplied by a road
 * factor in estimateTravel to approximate a driving route.
 */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const earthRadiusKm = 6371.0088;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateTravel(
  customer: GeoPoint,
  store: GeoPoint,
  options: TravelOptions = {},
): TravelEstimate {
  const resolved = resolveTravelOptions(options);
  const straightLineDistanceKm = haversineKm(customer, store);
  const roadDistanceKm = straightLineDistanceKm * resolved.roadDistanceFactor;
  const billedDistanceKm =
    roadDistanceKm * (resolved.roundTrip ? 2 : 1);

  return {
    straightLineDistanceKm: round(straightLineDistanceKm, 2),
    roadDistanceKm: round(roadDistanceKm, 2),
    billedDistanceKm: round(billedDistanceKm, 2),
    travelCost: round(billedDistanceKm * resolved.travelCostPerKm, 2),
    estimatedTravelMinutes: Math.round(
      (billedDistanceKm / resolved.averageSpeedKmH) * 60,
    ),
    ...resolved,
  };
}
