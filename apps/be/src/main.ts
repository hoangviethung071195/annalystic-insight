import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tăng giới hạn payload JSON
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for Nuxt dev server (default: 3000) and production
  app.enableCors({
    origin: true, // Cho phép mọi origin động (cần thiết cho Electron client chạy dạng file://)
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend is running on http://0.0.0.0:${port}`);
}
bootstrap();
