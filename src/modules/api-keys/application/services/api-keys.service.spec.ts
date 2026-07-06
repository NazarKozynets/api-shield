import {
  ForbiddenException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyStatus } from '../../domain/enums/api-key.enum';
import {
  ApiKeysRepository,
  ApiKeyWithTenant,
} from '../../domain/repositories/api-keys.repository';
import { ApiKeyEntity } from '../../domain/entities/api-key.entity';
import { TenantEntity } from '../../../tenants/domain/entities/tenant.entity';
import { TenantStatus } from '../../../tenants/domain/enums/tenant.enum';
import { hashApiKey } from '../../infrastructure/crypto/api-key.hasher';

function restoreApiKey(
  overrides: Partial<Parameters<typeof ApiKeyEntity.restore>[0]> = {},
) {
  return ApiKeyEntity.restore({
    id: 'api-key-id',
    tenantId: 'tenant-id',
    name: 'Primary key',
    keyPrefix: 'sk_test_123',
    keyHash: 'hashed-key',
    status: ApiKeyStatus.ACTIVE,
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  });
}

function restoreTenant(
  overrides: Partial<Parameters<typeof TenantEntity.restore>[0]> = {},
) {
  return TenantEntity.restore({
    id: 'tenant-id',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.ACTIVE,
    ...overrides,
  });
}

describe('ApiKeysService', () => {
  let repository: jest.Mocked<ApiKeysRepository>;
  let service: ApiKeysService;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = {
      findByHash: jest.fn(),
      findByHashWithTenant: jest.fn(),
    };
    service = new ApiKeysService(repository);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('hashes the raw API key, loads key with tenant, and returns the auth principal', async () => {
    const rawApiKey = 'sk_test_raw_secret';
    repository.findByHashWithTenant.mockResolvedValue({
      apiKey: restoreApiKey({ id: 'api-key-id' }),
      tenant: restoreTenant({ id: 'tenant-id', slug: 'tenant-slug' }),
    });

    await expect(service.authenticate(rawApiKey)).resolves.toEqual({
      apiKeyId: 'api-key-id',
      tenantId: 'tenant-id',
      tenantSlug: 'tenant-slug',
    });

    expect(repository.findByHashWithTenant).toHaveBeenCalledTimes(1);
    expect(repository.findByHashWithTenant).toHaveBeenCalledWith(
      hashApiKey(rawApiKey),
    );
  });

  it('throws NotFoundException when the key hash is unknown', async () => {
    repository.findByHashWithTenant.mockResolvedValue(null);

    await expect(service.authenticate('missing-key')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([
    {
      reason: 'key is revoked',
      apiKey: restoreApiKey({ status: ApiKeyStatus.REVOKED }),
    },
    {
      reason: 'key status is expired',
      apiKey: restoreApiKey({ status: ApiKeyStatus.EXPIRED }),
    },
    {
      reason: 'key expiration date has passed',
      apiKey: restoreApiKey({
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    },
  ])('throws UnauthorizedException when $reason', async ({ apiKey }) => {
    repository.findByHashWithTenant.mockResolvedValue({
      apiKey,
      tenant: restoreTenant(),
    });

    await expect(service.authenticate('raw-key')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when the tenant is not active', async () => {
    repository.findByHashWithTenant.mockResolvedValue({
      apiKey: restoreApiKey(),
      tenant: restoreTenant({ status: TenantStatus.SUSPENDED }),
    });

    await expect(service.authenticate('raw-key')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each([
    {
      reason: 'apiKey is missing from repository result',
      result: { apiKey: null, tenant: restoreTenant() },
      expectedException: NotFoundException,
    },
    {
      reason: 'tenant is missing from repository result',
      result: { apiKey: restoreApiKey(), tenant: null },
      expectedException: NotFoundException,
    },
  ])(
    'throws NotFoundException when $reason',
    async ({ result, expectedException }) => {
      repository.findByHashWithTenant.mockResolvedValue(
        result as unknown as ApiKeyWithTenant,
      );

      await expect(service.authenticate('raw-key')).rejects.toBeInstanceOf(
        expectedException,
      );
    },
  );
});
