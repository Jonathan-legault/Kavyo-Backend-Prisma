import { BadRequestException } from "@nestjs/common";
import { PostalCodeService } from "./postal-code.service.js";

describe("PostalCodeService", () => {
  const service = new PostalCodeService();

  it("normalizes casing and whitespace", () => {
    expect(service.normalize(" t3m 1t4 ")).toBe("T3M1T4");
  });

  it("accepts a three-character FSA", () => {
    expect(service.normalize("t3m")).toBe("T3M");
  });

  it("locates a supported Calgary postal code", () => {
    const location = service.locate("T3M 1T4");

    expect(location.fsa).toBe("T3M");
    expect(location.latitude).toBeCloseTo(50.8902);
    expect(location.longitude).toBeCloseTo(-113.9892);
    expect(location.precision).toBe("FSA_CENTROID");
  });

  it("rejects an invalid Canadian postal code", () => {
    expect(() => service.normalize("12345")).toThrow(BadRequestException);
  });

  it("rejects a postal code outside the supported Calgary area", () => {
    expect(() => service.locate("T4A 0A1")).toThrow(BadRequestException);
  });
});
