import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';
import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = (await NestFactory.create(AppModule)) as any;

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  });

  const configService: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);
  const frontendUrl = configService.get('FRONTEND_URL', { infer: true });
  const isProduction = process.env.NODE_ENV === 'production';

  const corsOrigins = isProduction
    ? [frontendUrl]
    : [frontendUrl, 'http://localhost:3001', 'http://localhost:3000'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 1000,
      message: 'Muitas requisições. Tente novamente em 10 minutos.',
    }),
  );

  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 30,
      message: 'Muitas tentativas de login. Tente novamente em 10 minutos.',
    }),
  );

  app.use(
    '/auth/forgot-password',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message:
        'Muitas solicitações de recuperação de senha. Tente novamente em 15 minutos.',
    }),
  );

  app.use(
    '/auth/reset-password',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message:
        'Muitas tentativas de redefinição de senha. Tente novamente em 15 minutos.',
    }),
  );

  const port = configService.get('PORT', { infer: true });

  const config = new DocumentBuilder()
    .setTitle('Documentação da API - SELLOU')
    .setDescription('Documentação da API - SELLOU')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();
