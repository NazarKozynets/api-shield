import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import {
  ApiKeysRepository,
  ApiKeyWithTenant,
} from '../../domain/repositories/api-keys.repository';
import { ApiKeyEntity } from '../../domain/entities/api-key.entity';
import { ApiKeyMapper } from './api-key.mapper';
import { TenantMapper } from 'src/modules/tenants/infrastructure/persistence/tenant.mapper';

@Injectable()
export class PrismaApiKeysRepository implements ApiKeysRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByHash(keyHash: string): Promise<ApiKeyEntity | null> {
    const apiKeyRaw = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKeyRaw) return null;

    return ApiKeyMapper.toDomain(apiKeyRaw);
  }

  async findByHashWithTenant(
    keyHash: string,
  ): Promise<ApiKeyWithTenant | null> {
    const apiKeyRaw = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        tenant: true,
      },
    });

    if (!apiKeyRaw) return null;

    return {
      apiKey: ApiKeyMapper.toDomain(apiKeyRaw),
      tenant: TenantMapper.toDomain(apiKeyRaw.tenant),
    };
  }
}
