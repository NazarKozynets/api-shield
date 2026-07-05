import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  providers: [HealthController],
})
export class HealthModule {}
