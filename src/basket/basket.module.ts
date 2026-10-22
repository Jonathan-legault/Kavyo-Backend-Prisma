import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { BasketComparisonService } from "./comparison.service.js";
import { BasketsController } from "./baskets.controller.js";
import { BasketsService } from "./baskets.service.js";
import { PostalCodeService } from "./calculation/postal-code.service.js";
import { QuickCompareController } from "./quick-compare.controller.js";
import { QuickCompareService } from "./quick-compare.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [QuickCompareController, BasketsController],
  providers: [
    QuickCompareService,
    BasketsService,
    BasketComparisonService,
    PostalCodeService,
  ],
})
export class BasketModule {}
