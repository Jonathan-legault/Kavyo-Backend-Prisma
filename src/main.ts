import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Explicit origins are retained even when FRONTEND_URL is configured.
  // Browser Origin headers do not include a trailing slash.
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://kavyo-frontend-pyw1lt5r9-sherrymagics-projects.vercel.app",
    ...(process.env.FRONTEND_URL?.split(",") ?? []),
  ].map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
