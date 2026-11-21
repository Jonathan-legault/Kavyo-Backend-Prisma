import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import type { AuthenticatedRequest } from "../auth/types/authenticated-request.type.js";
import { AdminFlyerOffersService } from "./admin-flyer-offers.service.js";
import { AdminListFlyerOffersQueryDto } from "./dto/admin-list-flyer-offers.dto.js";
import { ReviewFlyerOfferDto } from "./dto/review-flyer-offer.dto.js";

@Controller("admin/flyer-offers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class AdminFlyerOffersController {
  constructor(private readonly service: AdminFlyerOffersService) {}

  @Get("summary")
  getSummary(
    @Query("batchId", new ParseUUIDPipe({ optional: true }))
    batchId?: string,
  ) {
    return this.service.getSummary(batchId);
  }

  @Get()
  list(@Query() query: AdminListFlyerOffersQueryDto) {
    return this.service.list(query);
  }

  @Get(":id")
  getOffer(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.getOffer(id);
  }

  @Patch(":id/review")
  reviewOffer(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewFlyerOfferDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.reviewOffer(id, dto, req.user.sub);
  }
}
