import { Module } from "@nestjs/common";
import { BasketController } from "./basket.controller.js";
import { BasketService } from "./basket.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  controllers: [BasketController],
  providers: [BasketService],
})
export class BasketModule {}

