import { Body, Controller, Post } from "@nestjs/common";
import { QuickCompareService } from "./quick-compare.service.js";
import { CompareBasketDto } from "./dto/compare-basket.dto.js";

@Controller("basket")
export class QuickCompareController {
  constructor(
    private readonly quickCompareService: QuickCompareService,
  ) {}

  /**
   * Quick, stateless comparison retained for existing Postman flows.
   * The persisted flow is POST /baskets/:id/compare.
   */
  @Post("compare")
  compare(@Body() dto: CompareBasketDto) {
    return this.quickCompareService.compare(dto);
  }
}
