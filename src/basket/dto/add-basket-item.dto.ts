import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class AddBasketItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  quantity?: number;
}
