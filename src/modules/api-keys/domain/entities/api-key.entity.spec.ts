import { ApiKeyStatus } from '../enums/api-key.enum';
import { ApiKeyEntity } from './api-key.entity';

const baseProps = {
  id: 'api-key-id',
  tenantId: 'tenant-id',
  name: 'Primary key',
  keyPrefix: 'sk_test_123',
  keyHash: 'hashed-key',
  status: ApiKeyStatus.ACTIVE,
  expiresAt: null,
  revokedAt: null,
};

function restoreApiKey(
  overrides: Partial<Parameters<typeof ApiKeyEntity.restore>[0]> = {},
) {
  return ApiKeyEntity.restore({
    ...baseProps,
    ...overrides,
  });
}

describe('ApiKeyEntity', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  it('allows active keys that are not revoked and not expired', () => {
    const apiKey = restoreApiKey({
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(apiKey.isActive(now)).toBe(true);
    expect(apiKey.isExpired(now)).toBe(false);
  });

  it.each([
    {
      reason: 'status is revoked',
      overrides: { status: ApiKeyStatus.REVOKED },
    },
    {
      reason: 'status is expired',
      overrides: { status: ApiKeyStatus.EXPIRED },
    },
    {
      reason: 'key has a revoke timestamp',
      overrides: { revokedAt: new Date('2025-12-31T00:00:00.000Z') },
    },
    {
      reason: 'expiration time has passed',
      overrides: { expiresAt: new Date('2025-12-31T00:00:00.000Z') },
    },
  ])('rejects inactive keys when $reason', ({ overrides }) => {
    const apiKey = restoreApiKey(overrides);

    expect(apiKey.isActive(now)).toBe(false);
  });

  it('treats expiration at the current instant as expired', () => {
    const apiKey = restoreApiKey({ expiresAt: now });

    expect(apiKey.isExpired(now)).toBe(true);
    expect(apiKey.isActive(now)).toBe(false);
  });
});
