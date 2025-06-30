import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  


  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Dice Casino API')
    .setDescription('3D Dice Rolling Casino with Crypto Payments')
    .setVersion('1.0')
    .addTag('dice-casino')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
    const customOptions: SwaggerCustomOptions = {
    customSiteTitle: 'Backend',
    customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  };
  SwaggerModule.setup('api', app, document,customOptions);
app.enableCors();

  await app.listen(3000);
}
bootstrap();