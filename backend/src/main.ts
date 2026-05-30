import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS HTTP liberado para o frontend — o WebSocket tem CORS próprio no gateway
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚇 Backend rodando na porta ${port}`);
}

bootstrap();
