import { BadRequestException, Injectable } from "@nestjs/common";
import {
  CALGARY_FSA_CENTROIDS,
  SUPPORTED_CALGARY_FSA_MESSAGE,
} from "./postal-codes.js";

export interface PostalLocation {
  postalCode: string;
  fsa: string;
  latitude: number;
  longitude: number;
  precision: "FSA_CENTROID";
}

const POSTAL_CODE_PATTERN = /^[A-Z]\d[A-Z](?:\d[A-Z]\d)?$/;

@Injectable()
export class PostalCodeService {
  /**
   * Normalizes "T3M 1T4" / "t3m1t4" / "T3M" to "T3M1T4" / "T3M".
   * Both a full postal code and a three-character FSA are accepted.
   */
  normalize(postalCode: string): string {
    const normalized = postalCode.replace(/\s+/g, "").toUpperCase();

    if (!POSTAL_CODE_PATTERN.test(normalized)) {
      throw new BadRequestException(
        "postalCode must be a valid Canadian postal code or FSA (for example T3M 1T4).",
      );
    }

    return normalized;
  }

  /**
   * Resolves the approximate centre of the customer's FSA. This is sufficient
   * for a prototype decision and deliberately avoids a live geocoding API.
   */
  locate(postalCode: string): PostalLocation {
    const normalized = this.normalize(postalCode);
    const fsa = normalized.slice(0, 3);
    const centroid = CALGARY_FSA_CENTROIDS[fsa];

    if (!centroid) {
      throw new BadRequestException(
        `${SUPPORTED_CALGARY_FSA_MESSAGE} Received ${fsa}.`,
      );
    }

    return {
      postalCode: normalized,
      fsa,
      latitude: centroid.latitude,
      longitude: centroid.longitude,
      precision: "FSA_CENTROID",
    };
  }
}
