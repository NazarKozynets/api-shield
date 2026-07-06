import { ApiKeyStatus as PrismaApiKeyStatus } from '@prisma/client';
import { ApiKeyStatus } from '../../domain/enums/api-key.enum';
import { ApiKeyMapper } from './api-key.mapper';

describe('ApiKeyMapper', () => {
  it.each([
    [PrismaApiKeyStatus.ACTIVE, ApiKeyStatus.ACTIVE],
    [PrismaApiKeyStatus.REVOKED, ApiKeyStatus.REVOKED],
    [PrismaApiKeyStatus.EXPIRED, ApiKeyStatus.EXPIRED],
  ])('maps Prisma status %s to domain status %s', (prismaStatus, domainStatus) => {
    expect(ApiKeyMapper.mapStatusToDomain(prismaStatus)).toBe(domainStatus);
  });

  it('restores a domain entity from persistence data', () => {
    const expiresAt = new Date('2026-01-02T00:00:00.000Z');
    const revokedAt = new Date('2026-01-03T00:00:00.000Z');

    const entity = ApiKeyMapper.toDomain({
      id: 'api-key-id',
      tenantId: 'tenant-id',
      name: 'Billing key',
      keyPrefix: 'sk_test_abc',
      keyHash: 'hashed-key',
      status: PrismaApiKeyStatus.REVOKED,
      expiresAt,
      revokedAt,
    });

    expect(entity.id).toBe('api-key-id');
    expect(entity.tenantId).toBe('tenant-id');
    expect(entity.name).toBe('Billing key');
    expect(entity.keyPrefix).toBe('sk_test_abc');
    expect(entity.keyHash).toBe('hashed-key');
    expect(entity.status).toBe(ApiKeyStatus.REVOKED);
    expect(entity.expiresAt).toBe(expiresAt);
    expect(entity.revokedAt).toBe(revokedAt);
  });
});
