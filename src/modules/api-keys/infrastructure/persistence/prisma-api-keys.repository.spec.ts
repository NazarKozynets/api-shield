import { ApiKeyStatus as PrismaApiKeyStatus, TenantStatus as PrismaTenantStatus } from '@prisma/client';
import { PrismaApiKeysRepository } from './prisma-api-keys.repository';
import { ApiKeyStatus } from '../../domain/enums/api-key.enum';

jest.mock(
  'src/modules/tenants/infrastructure/persistence/tenant.mapper',
  () => ({
    TenantMapper: {
      toDomain: jest.fn((raw) => ({
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        status: raw.status,
      })),
    },
  }),
  { virtual: true },
);

import { TenantMapper } from 'src/modules/tenants/infrastructure/persistence/tenant.mapper';

describe('PrismaApiKeysRepository', () => {
  const apiKeyRaw = {
    id: 'api-key-id',
    tenantId: 'tenant-id',
    name: 'Primary key',
    keyPrefix: 'sk_test_123',
    keyHash: 'hashed-key',
    status: PrismaApiKeyStatus.ACTIVE,
    expiresAt: null,
    revokedAt: null,
  };

  const tenantRaw = {
    id: 'tenant-id',
    name: 'Acme',
    slug: 'acme',
    status: PrismaTenantStatus.ACTIVE,
  };

  let prisma: {
    apiKey: {
      findUnique: jest.Mock;
    };
  };
  let repository: PrismaApiKeysRepository;

  beforeEach(() => {
    prisma = {
      apiKey: {
        findUnique: jest.fn(),
      },
    };
    repository = new PrismaApiKeysRepository(prisma as never);
    jest.clearAllMocks();
  });

  it('returns null when an API key hash is not found', async () => {
    prisma.apiKey.findUnique.mockResolvedValue(null);

    await expect(repository.findByHash('missing-hash')).resolves.toBeNull();

    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash: 'missing-hash' },
    });
  });

  it('loads an API key by hash and maps it to the domain entity', async () => {
    prisma.apiKey.findUnique.mockResolvedValue(apiKeyRaw);

    const result = await repository.findByHash('hashed-key');

    expect(result?.id).toBe('api-key-id');
    expect(result?.status).toBe(ApiKeyStatus.ACTIVE);
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash: 'hashed-key' },
    });
  });

  it('loads an API key with its tenant and maps both persistence objects', async () => {
    prisma.apiKey.findUnique.mockResolvedValue({
      ...apiKeyRaw,
      tenant: tenantRaw,
    });

    const result = await repository.findByHashWithTenant('hashed-key');

    expect(result?.apiKey.id).toBe('api-key-id');
    expect(result?.tenant.id).toBe('tenant-id');
    expect(TenantMapper.toDomain).toHaveBeenCalledWith(tenantRaw);
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash: 'hashed-key' },
      include: {
        tenant: true,
      },
    });
  });
});
