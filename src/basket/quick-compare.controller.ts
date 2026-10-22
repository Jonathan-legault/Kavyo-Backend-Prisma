import { Body, Controller, Post } from "@nestjs/common";
import { BasketService } from "./basket.service.js";
import { CompareBasketDto } from "./dto/compare-basket.dto.js";

@Controller("basket")
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  /**
   * Quick, stateless comparison retained for existing Postman flows.
   * The persisted flow is POST /baskets/:id/compare.
   */
  @Post("compare")
  compare(@Body() dto: CompareBasketDto) {
    return this.basketService.compare(dto);
  }
}
