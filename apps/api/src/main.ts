import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/app-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('app.port');

  configureApp(app);

  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
