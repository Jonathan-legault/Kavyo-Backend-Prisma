import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import {
  POSTAL_CODE_MESSAGE,
  POSTAL_CODE_PATTERN,
} from "./postal-code-pattern.js";

export class BasketItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

export class CompareOptionsDto {
  @IsOptional()
  @IsString()
  @Matches(POSTAL_CODE_PATTERN, { message: POSTAL_CODE_MESSAGE })
  postalCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  travelCostPerKm?: number;

  @IsOptional()
  @IsBoolean()
  roundTrip?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(2)
  roadDistanceFactor?: number;

  @IsOptional()
  @IsUUID()
  baselineStoreId?: string;
}

export class CompareBasketDto extends CompareOptionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BasketItemDto)
  items: BasketItemDto[];
}

export class ComparePersistedBasketDto extends CompareOptionsDto {}
