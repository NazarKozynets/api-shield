import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
    {
      rawBody: true,
    },
  );

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
}

void bootstrap();
