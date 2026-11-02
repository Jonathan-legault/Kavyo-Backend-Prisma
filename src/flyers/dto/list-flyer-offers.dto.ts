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
  MinLength,
} from "class-validator";

export class ListFlyerOffersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  retailer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  family?: string;

  @IsOptional()
  @IsIn(["NORMALIZED", "PENDING_REVIEW", "ALL"])
  status?: "NORMALIZED" | "PENDING_REVIEW" | "ALL";

  @IsOptional()
  @IsIn(["unitPrice", "price", "name"])
  sort?: "unitPrice" | "price" | "name";

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

export class CompareFlyerOffersQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  q: string;

  @IsOptional()
  @IsIn(["FAMILY", "EXACT"])
  mode?: "FAMILY" | "EXACT";

  @IsOptional()
  @IsIn(["NORMALIZED", "PENDING_REVIEW", "ALL"])
  status?: "NORMALIZED" | "PENDING_REVIEW" | "ALL";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  retailer?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  limit?: number;
}
