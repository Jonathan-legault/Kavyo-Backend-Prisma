import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { BasketController } from "./basket.controller.js";
import { BasketService } from "./basket.service.js";
import { BasketComparisonService } from "./comparison.service.js";
import { BasketsController } from "./baskets.controller.js";
import { BasketsService } from "./baskets.service.js";
import { PostalCodeService } from "./calculation/postal-code.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [BasketController, BasketsController],
  providers: [
    BasketService,
    BasketsService,
    BasketComparisonService,
    PostalCodeService,
  ],
})
export class BasketModule {}
