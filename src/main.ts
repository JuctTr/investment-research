import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // 全局前缀
  app.setGlobalPrefix('api/v1');

  // CORS配置
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('投研分析系统 API')
    .setDescription('个人投研分析系统后端API文档')
    .setVersion('1.0')
    .addTag('contents')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`应用正在运行，端口: ${port}`);
  console.log(`API文档地址: http://localhost:${port}/api`);
}

bootstrap();