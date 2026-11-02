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
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import type { AuthenticatedRequest } from "../auth/types/authenticated-request.type.js";
import { BasketComparisonService } from "./comparison.service.js";
import { BasketsService } from "./baskets.service.js";
import { AddBasketItemDto } from "./dto/add-basket-item.dto.js";
import { ComparePersistedBasketDto } from "./dto/compare-basket.dto.js";
import { CreateBasketDto } from "./dto/create-basket.dto.js";
import { UpdateBasketItemDto } from "./dto/update-basket-item.dto.js";
import { UpdateBasketDto } from "./dto/update-basket.dto.js";

@Controller("baskets")
@UseGuards(JwtAuthGuard)
export class BasketsController {
  constructor(
    private readonly basketsService: BasketsService,
    private readonly comparisonService: BasketComparisonService,
  ) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBasketDto,
  ) {
    return this.basketsService.create(req.user.sub, dto);
  }

  @Get(":id")
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.basketsService.findOne(req.user.sub, id);
  }

  @Patch(":id")
  update(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBasketDto,
  ) {
    return this.basketsService.update(req.user.sub, id, dto);
  }

  @Post(":id/items")
  addItem(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddBasketItemDto,
  ) {
    return this.basketsService.addItem(req.user.sub, id, dto);
  }

  @Patch(":id/items/:itemId")
  updateItem(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateBasketItemDto,
  ) {
    return this.basketsService.updateItem(
      req.user.sub,
      id,
      itemId,
      dto,
    );
  }

  @Delete(":id/items/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
  ) {
    await this.basketsService.removeItem(req.user.sub, id, itemId);
  }

  @Post(":id/compare")
  compare(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ComparePersistedBasketDto,
  ) {
    return this.comparisonService.compareBasket(
      req.user.sub,
      id,
      dto,
    );
  }
}
