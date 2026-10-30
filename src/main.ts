import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  // Keep the default Nest parsers for every existing route, while applying the
  // feedback ceiling to streamed/chunked requests before JSON is decoded.
  app.use('/api/v1/feedback', express.json({ limit: '8192b' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
