import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { PostalCodeService } from "./calculation/postal-code.service.js";
import { toNumber } from "./calculation/pricing.js";
import { AddBasketItemDto } from "./dto/add-basket-item.dto.js";
import { CreateBasketDto } from "./dto/create-basket.dto.js";
import { UpdateBasketItemDto } from "./dto/update-basket-item.dto.js";
import { UpdateBasketDto } from "./dto/update-basket.dto.js";

const basketInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          barcode: true,
          productName: true,
          brand: true,
          quantityText: true,
          quantityValue: true,
          quantityUnit: true,
          isActive: true,
        },
      },
    },
  },
};

@Injectable()
export class BasketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postalCodeService: PostalCodeService,
  ) {}

  async create(userId: string, dto: CreateBasketDto) {
    const postalCode = dto.postalCode
      ? this.postalCodeService.locate(dto.postalCode).postalCode
      : null;

    const basket = await this.prisma.basket.create({
      data: {
        userId,
        status: "active",
        postalCode,
      },
      include: basketInclude,
    });

    return this.toBasketResponse(basket);
  }

  async findOne(userId: string, basketId: string) {
    const basket = await this.prisma.basket.findFirst({
      where: {
        id: basketId,
        userId,
      },
      include: basketInclude,
    });

    if (!basket) {
      throw new NotFoundException("Basket not found.");
    }

    return this.toBasketResponse(basket);
  }

  async update(
    userId: string,
    basketId: string,
    dto: UpdateBasketDto,
  ) {
    await this.assertActiveBasket(userId, basketId);

    const postalCode = dto.postalCode
      ? this.postalCodeService.locate(dto.postalCode).postalCode
      : undefined;

    await this.prisma.basket.update({
      where: { id: basketId },
      data: postalCode !== undefined ? { postalCode } : {},
    });

    return this.findOne(userId, basketId);
  }

  async addItem(
    userId: string,
    basketId: string,
    dto: AddBasketItemDto,
  ) {
    await this.assertActiveBasket(userId, basketId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, productName: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw new BadRequestException(
        "productId is invalid or the product is inactive.",
      );
    }

    try {
      await this.prisma.basketItem.create({
        data: {
          basketId,
          productId: dto.productId,
          quantity: dto.quantity ?? 1,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw new ConflictException(
          "That product is already in the basket. Update its quantity instead.",
        );
      }

      throw error;
    }

    return this.findOne(userId, basketId);
  }

  async updateItem(
    userId: string,
    basketId: string,
    itemId: string,
    dto: UpdateBasketItemDto,
  ) {
    await this.assertActiveBasket(userId, basketId);

    const item = await this.prisma.basketItem.findFirst({
      where: {
        id: itemId,
        basketId,
      },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException("Basket item not found.");
    }

    await this.prisma.basketItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.findOne(userId, basketId);
  }

  async removeItem(
    userId: string,
    basketId: string,
    itemId: string,
  ) {
    await this.assertActiveBasket(userId, basketId);

    const result = await this.prisma.basketItem.deleteMany({
      where: {
        id: itemId,
        basketId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Basket item not found.");
    }
  }

  private async assertActiveBasket(
    userId: string,
    basketId: string,
  ) {
    const basket = await this.prisma.basket.findFirst({
      where: {
        id: basketId,
        userId,
      },
      select: { id: true, status: true },
    });

    if (!basket) {
      throw new NotFoundException("Basket not found.");
    }

    if (basket.status !== "active") {
      throw new BadRequestException("Basket is not active.");
    }
  }

  private toBasketResponse(basket: {
    id: string;
    postalCode: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      createdAt: Date;
      updatedAt: Date;
      product: {
        id: string;
        barcode: string;
        productName: string;
        brand: string | null;
        quantityText: string | null;
        quantityValue: { toString(): string } | null;
        quantityUnit: string | null;
        isActive: boolean;
      };
    }>;
  }) {
    return {
      id: basket.id,
      postalCode: basket.postalCode,
      status: basket.status,
      itemCount: basket.items.length,
      items: basket.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          barcode: item.product.barcode,
          productName: item.product.productName,
          brand: item.product.brand,
          quantityText: item.product.quantityText,
          quantityValue: toNumber(item.product.quantityValue),
          quantityUnit: item.product.quantityUnit,
          isActive: item.product.isActive,
        },
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      createdAt: basket.createdAt.toISOString(),
      updatedAt: basket.updatedAt.toISOString(),
    };
  }
}
