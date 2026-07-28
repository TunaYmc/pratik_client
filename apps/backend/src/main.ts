import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Allow requests from different domains (e.g., frontend)
  app.setGlobalPrefix('api');
  
  // Use WsAdapter for raw WebSockets (required for Go agent using gorilla/websocket)
  app.useWebSocketAdapter(new WsAdapter(app));
  
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
