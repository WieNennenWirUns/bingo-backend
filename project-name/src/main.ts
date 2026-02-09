import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const errorMessages = errors.map(error => ({
          field: error.property,
          messages: Object.values(error.constraints || {})
        }));

        return new BadRequestException({
          statusCode: 400,
          message: 'validation-error',
          errors: errorMessages
        });
      }
    })
  );

  await app.listen(3000);
  console.log('server running on http://localhost:3000');
}
bootstrap();
