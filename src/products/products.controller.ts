import { Controller, Get, Query } from "@nestjs/common";
import { ListProductsQueryDto } from "./dto/list-products.dto.js";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsQueryDto) {
    return this.productsService.list(query);
  }
}
