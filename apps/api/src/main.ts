import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true, // Auto-transform types
    }),
  );

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
