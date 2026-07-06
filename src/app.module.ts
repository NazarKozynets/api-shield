import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './modules/health/health.controller';
import { HealthModule } from './modules/health/health.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';

@Module({
  imports: [HealthModule, ApiKeysModule],
  controllers: [AppController, HealthController],
  providers: [
    AppService
  ],
})
export class AppModule {}
