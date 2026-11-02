
import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Controller("basket")
export class BasketProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        priceObservations: {
          include: {
            store: {
              include: {
                retailer: true,
              },
            },
          },
        },
      },
    });

    return products.map((product) => ({
      ...product,
      storePrices: product.priceObservations,
    }));
  }
}
