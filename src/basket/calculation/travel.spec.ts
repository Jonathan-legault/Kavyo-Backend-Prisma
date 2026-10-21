import {
  DEFAULT_TRAVEL_OPTIONS,
  estimateTravel,
  haversineKm,
} from "./travel.js";

const downtownCalgary = {
  latitude: 51.0472,
  longitude: -114.0802,
};

const setonSuperstore = {
  latitude: 50.8747393,
  longitude: -113.9604453,
};

describe("haversineKm", () => {
  it("calculates a realistic distance between two Calgary points", () => {
    const distance = haversineKm(downtownCalgary, setonSuperstore);

    expect(distance).toBeGreaterThan(19);
    expect(distance).toBeLessThan(23);
  });

  it("returns zero for the same point", () => {
    expect(haversineKm(downtownCalgary, downtownCalgary)).toBe(0);
  });
});

describe("estimateTravel", () => {
  it("applies the road factor, round trip, and cost per kilometre", () => {
    const result = estimateTravel(downtownCalgary, setonSuperstore);

    const expectedBilled = Math.round(
      result.roadDistanceKm * 2 * 100,
    ) / 100;

    expect(result.roundTrip).toBe(true);
    expect(result.roadDistanceFactor).toBe(
      DEFAULT_TRAVEL_OPTIONS.roadDistanceFactor,
    );
    expect(result.billedDistanceKm).toBe(expectedBilled);
    expect(result.travelCost).toBe(
      Math.round(expectedBilled * DEFAULT_TRAVEL_OPTIONS.travelCostPerKm * 100) /
        100,
    );
    expect(result.estimatedTravelMinutes).toBeGreaterThan(0);
  });

  it("can bill a one-way trip", () => {
    const roundTrip = estimateTravel(downtownCalgary, setonSuperstore);
    const oneWay = estimateTravel(downtownCalgary, setonSuperstore, {
      roundTrip: false,
    });

    expect(oneWay.billedDistanceKm).toBe(oneWay.roadDistanceKm);
    expect(oneWay.travelCost).toBeLessThan(roundTrip.travelCost);
  });

  it("honours custom cost and road-factor options", () => {
    const result = estimateTravel(downtownCalgary, setonSuperstore, {
      travelCostPerKm: 0.5,
      roadDistanceFactor: 1,
      roundTrip: false,
    });

    expect(result.travelCostPerKm).toBe(0.5);
    expect(result.roadDistanceFactor).toBe(1);
    expect(result.billedDistanceKm).toBe(result.roadDistanceKm);
  });
});
