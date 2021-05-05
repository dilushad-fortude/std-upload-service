import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws'

async function bootstrap() {
  const port = process.env.PORT ? Number(process.env.PORT) : 8082;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port
    }
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.listen(() => console.log('Microservice listening on port:', port));
}
bootstrap();
