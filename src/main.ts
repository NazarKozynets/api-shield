import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './common/filters/exceptions.filter';
import { AppLogger } from './common/logger/app.logger';

async function bootstrap() {
  const logger = new AppLogger('Bootstrap', { suppressNestStartupLogs: true });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
    {
      rawBody: true,
      logger,
    },
  );
  app.useGlobalFilters(new ExceptionsFilter(logger));

  const port = Number(process.env.PORT) || 3000;

  const config = new DocumentBuilder()
    .setTitle('API SHIELD')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('shield')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(port, '0.0.0.0');
  logger.log(`NestJS application successfully started in ${process.env.NODE_ENV} mode on port ${port}`);
}

void bootstrap();
