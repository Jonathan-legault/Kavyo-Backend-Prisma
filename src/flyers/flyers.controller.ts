import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import {
  CompareFlyerOffersQueryDto,
  ListFlyerOffersQueryDto,
} from "./dto/list-flyer-offers.dto.js";
import { FlyersService } from "./flyers.service.js";

@Controller("flyers")
export class FlyersController {
  constructor(private readonly flyersService: FlyersService) {}

  @Get("offers")
  listOffers(@Query() query: ListFlyerOffersQueryDto) {
    return this.flyersService.listOffers(query);
  }

  @Get("offers/:id")
  getOffer(@Param("id", ParseUUIDPipe) id: string) {
    return this.flyersService.getOffer(id);
  }

  @Get("compare")
  compareOffers(@Query() query: CompareFlyerOffersQueryDto) {
    return this.flyersService.compareOffers(query);
  }

  @Get("summary")
  getSummary() {
    return this.flyersService.getSummary();
  }
}
