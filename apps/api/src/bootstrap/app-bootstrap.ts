import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const appUrl = configService.getOrThrow<string>('app.url');

  app.setGlobalPrefix('api');

  app.use(helmet());

  app.enableCors({
    origin: appUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
