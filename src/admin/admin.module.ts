import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AdminFlyerOffersController } from "./admin-flyer-offers.controller.js";
import { AdminFlyerOffersService } from "./admin-flyer-offers.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminFlyerOffersController],
  providers: [AdminFlyerOffersService],
})
export class AdminModule {}
