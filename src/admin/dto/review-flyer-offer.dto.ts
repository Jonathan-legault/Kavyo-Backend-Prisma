import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class ReviewFlyerOfferDto {
  @IsIn(["APPROVE", "REJECT", "NEEDS_INFO"])
  decision!: "APPROVE" | "REJECT" | "NEEDS_INFO";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsBoolean()
  createProduct?: boolean;

  @IsOptional()
  @IsBoolean()
  publishPrice?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  productName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  catalogKey?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  unitPrice?: number;
}
