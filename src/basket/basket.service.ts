import { Injectable } from "@nestjs/common";
import { BasketComparisonService } from "./comparison.service.js";
import { CompareBasketDto } from "./dto/compare-basket.dto.js";

@Injectable()
export class BasketService {
  constructor(
    private readonly comparisonService: BasketComparisonService,
  ) {}

  compare(dto: CompareBasketDto) {
    return this.comparisonService.compareItems(dto.items, dto);
  }
}
