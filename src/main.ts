import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { uploadConfig } from './config/upload.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(
    graphqlUploadExpress({
      maxFileSize: uploadConfig.maxFileSize,
      maxFiles: uploadConfig.maxFiles,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
