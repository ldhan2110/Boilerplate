import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BizExceptionFilter } from '@infra/common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new BizExceptionFilter());

  // CORS
  app.enableCors();

  // Swagger
  const configSwagger = new DocumentBuilder()
    .setTitle('Swagger NestJS API List')
    .setVersion('1.0')
    .addBearerAuth(
      {
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, documentFactory);


  // Start the server
  const port = config.get('PORT');
  const env = config.get('NODE_ENV');
  await app.listen(port, async () => {
    console.log(`==========================================`);
    console.log(`        ENV: ${env}    `);
    console.log(`🚀🚀 Server is running on the url: http://localhost:${port}/api  🚀🚀`);
    console.log(`==========================================`);
  });
}
bootstrap();
