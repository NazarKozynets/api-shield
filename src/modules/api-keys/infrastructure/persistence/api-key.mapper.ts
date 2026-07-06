import { ApiKeyEntity } from '../../domain/entities/api-key.entity';
import { ApiKeyStatus } from '../../domain/enums/api-key.enum';
import { ApiKeyStatus as PrismaApiKeyStatus } from '@prisma/client';

type PrismaApiKeyPersistence = {
  id: string;
  tenantId: string;

  name: string;
  keyPrefix: string;
  keyHash: string;

  status: PrismaApiKeyStatus;

  expiresAt: Date | null;
  revokedAt: Date | null;
};

export class ApiKeyMapper {
  static toDomain<T extends PrismaApiKeyPersistence>(raw: T): ApiKeyEntity {
    return ApiKeyEntity.restore({
      id: raw.id,
      tenantId: raw.tenantId,

      name: raw.name,
      keyPrefix: raw.keyPrefix,
      keyHash: raw.keyHash,

      status: this.mapStatusToDomain(raw.status),

      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
    });
  }

  // Maps persistence enum to domain
  static mapStatusToDomain(status: PrismaApiKeyStatus): ApiKeyStatus {
    switch (status) {
      case PrismaApiKeyStatus.ACTIVE:
        return ApiKeyStatus.ACTIVE;

      case PrismaApiKeyStatus.REVOKED:
        return ApiKeyStatus.REVOKED;

      case PrismaApiKeyStatus.EXPIRED:
        return ApiKeyStatus.EXPIRED;
    }
  }
}
