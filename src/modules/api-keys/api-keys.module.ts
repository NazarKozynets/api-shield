import 'dotenv/config';
import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ApiKeysService } from './application/services/api-keys.service';
import { API_KEYS_REPOSITORY } from './domain/repositories/api-keys.repository';
import { PrismaApiKeysRepository } from './infrastructure/persistence/prisma-api-keys.repository';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './presentation/guards/api-key.guard';

@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);

        return new PrismaClient({ adapter });
      },
    },
    ApiKeysService,
    {
      provide: API_KEYS_REPOSITORY,
      useClass: PrismaApiKeysRepository,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class ApiKeysModule {}
