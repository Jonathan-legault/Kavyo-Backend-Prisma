import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPostalCode,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { TransportMode } from '../../generated/prisma/enums.js';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsUUID()
  usualStoreId?: string | null;

  @IsOptional()
  @IsPostalCode('CA')
  postalCode?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  householdSize?: number | null;

  @IsOptional()
  @IsEnum(TransportMode)
  transportMode?: TransportMode | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTravelDistanceKm?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxExtraTravelMinutes?: number | null;
}