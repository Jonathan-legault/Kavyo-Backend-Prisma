import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { BasketComparisonService } from "./comparison.service.js";
import { BasketsService } from "./baskets.service.js";
import { AddBasketItemDto } from "./dto/add-basket-item.dto.js";
import { ComparePersistedBasketDto } from "./dto/compare-basket.dto.js";
import { CreateBasketDto } from "./dto/create-basket.dto.js";
import { UpdateBasketItemDto } from "./dto/update-basket-item.dto.js";
import { UpdateBasketDto } from "./dto/update-basket.dto.js";

@Controller("baskets")
export class BasketsController {
  constructor(
    private readonly basketsService: BasketsService,
    private readonly comparisonService: BasketComparisonService,
  ) {}

  @Post()
  create(@Body() dto: CreateBasketDto) {
    return this.basketsService.create(dto);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.basketsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBasketDto,
  ) {
    return this.basketsService.update(id, dto);
  }

  @Post(":id/items")
  addItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddBasketItemDto,
  ) {
    return this.basketsService.addItem(id, dto);
  }

  @Patch(":id/items/:itemId")
  updateItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateBasketItemDto,
  ) {
    return this.basketsService.updateItem(id, itemId, dto);
  }

  @Delete(":id/items/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
  ) {
    await this.basketsService.removeItem(id, itemId);
  }

  @Post(":id/compare")
  compare(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ComparePersistedBasketDto,
  ) {
    return this.comparisonService.compareBasket(id, dto);
  }
}
