import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Task 3 & 4: Find all products with optional search and barcode filters
  async findAll(search?: string, barcode?: string) {
    const where: any = {};

    if (barcode) {
      where.barcode = barcode;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        priceObservations: {
          include: { store: true },
        },
      },
    });
  }

  // Task 3: Find single product by ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        priceObservations: {
          include: { store: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // Task 4: Barcode specific lookup
  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: {
        priceObservations: {
          include: { store: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }

    return product;
  }

  // Helper to create a new product
  async create(dto: CreateProductDto) {
    const prismaAny = this.prisma as any;
    return prismaAny.product.create({
      data: {
        name: dto.name,
        brand: dto.brand,
        barcode: dto.barcode,
        category: dto.category,
      },
    });
  }
}