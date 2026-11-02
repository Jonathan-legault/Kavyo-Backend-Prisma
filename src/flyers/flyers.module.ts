import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { FlyersController } from "./flyers.controller.js";
import { FlyersService } from "./flyers.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [FlyersController],
  providers: [FlyersService],
})
export class FlyersModule {}
