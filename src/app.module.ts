import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductsModule } from './products/products.module.js'; // 1. Import your new module

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule], // 2. Add it here
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}