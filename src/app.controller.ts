import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service.js";
import { PrismaService } from "./prisma/prisma.service.js";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("db-check")
  async checkDatabase() {
    const [products, retailers, stores, priceObservations] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.retailer.count(),
        this.prisma.store.count(),
        this.prisma.priceObservation.count(),
      ]);

    return {
      database: "connected",
      products,
      retailers,
      stores,
      priceObservations,
    };
  }
}