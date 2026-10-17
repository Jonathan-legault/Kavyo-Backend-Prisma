import {
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsUUID()
  usualStoreId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTravelDistanceKm?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxExtraTravelMinutes?: number | null;
}