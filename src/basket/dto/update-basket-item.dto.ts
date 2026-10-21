import { IsInt, Max, Min } from "class-validator";

export class UpdateBasketItemDto {
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
