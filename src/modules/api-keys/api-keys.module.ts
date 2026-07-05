import { Module } from '@nestjs/common';
import { ApiKeysService } from './application/services/api-keys.service';
import { API_KEYS_REPOSITORY } from './domain/repositories/api-keys.repository';
import { PrismaApiKeysRepository } from './infrastructure/persistence/prisma-api-keys.repository';

@Module({
  providers: [
    ApiKeysService,
    {
      provide: API_KEYS_REPOSITORY,
      useClass: PrismaApiKeysRepository,
    },
  ],
})
export class ApiKeysModule {}
