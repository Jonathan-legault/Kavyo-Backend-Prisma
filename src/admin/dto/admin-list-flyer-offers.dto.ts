import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class AdminListFlyerOffersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  retailer?: string;

  @IsOptional()
  @IsIn(["PENDING_REVIEW", "NORMALIZED", "REJECTED", "ALL"])
  status?: "PENDING_REVIEW" | "NORMALIZED" | "REJECTED" | "ALL";

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
