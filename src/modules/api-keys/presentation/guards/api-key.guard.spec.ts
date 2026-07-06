import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiKeysService, ApiKeyPrincipal } from '../../application/services/api-keys.service';

jest.mock(
  'src/common/logger/app.logger',
  () => ({
    AppLogger: jest.fn().mockImplementation(() => ({
      debug: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    })),
  }),
  { virtual: true },
);

import { ApiKeyGuard } from './api-key.guard';

type MutableFastifyRequest = FastifyRequest & {
  auth?: ApiKeyPrincipal;
};

function createExecutionContext(headers: FastifyRequest['headers']) {
  const request = { headers } as MutableFastifyRequest;

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('ApiKeyGuard', () => {
  let service: jest.Mocked<Pick<ApiKeysService, 'authenticate'>>;
  let guard: ApiKeyGuard;

  const principal: ApiKeyPrincipal = {
    apiKeyId: 'api-key-id',
    tenantId: 'tenant-id',
    tenantSlug: 'tenant-slug',
  };

  beforeEach(() => {
    service = {
      authenticate: jest.fn(),
    };
    guard = new ApiKeyGuard(service as unknown as ApiKeysService);
  });

  it('passes the raw x-api-key value to the service and attaches auth to request', async () => {
    service.authenticate.mockResolvedValue(principal);
    const { context, request } = createExecutionContext({
      'x-api-key': 'sk_test_raw',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(service.authenticate).toHaveBeenCalledWith('sk_test_raw');
    expect(request.auth).toEqual(principal);
  });

  it('uses the first value when x-api-key is received as an array', async () => {
    service.authenticate.mockResolvedValue(principal);
    const { context } = createExecutionContext({
      'x-api-key': ['first-key', 'second-key'],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(service.authenticate).toHaveBeenCalledWith('first-key');
  });

  it.each([
    {
      reason: 'header is missing',
      headers: {},
    },
    {
      reason: 'header array is empty',
      headers: { 'x-api-key': [] },
    },
    {
      reason: 'header value is not a string',
      headers: { 'x-api-key': 123 },
    },
  ])('rejects request when $reason', async ({ headers }) => {
    const { context } = createExecutionContext(
      headers as unknown as FastifyRequest['headers'],
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(service.authenticate).not.toHaveBeenCalled();
  });

  it.each([
    {
      reason: 'service returns null',
      authResult: null,
    },
    {
      reason: 'principal is missing apiKeyId',
      authResult: { tenantId: 'tenant-id', tenantSlug: 'tenant-slug' },
    },
    {
      reason: 'principal is missing tenantId',
      authResult: { apiKeyId: 'api-key-id', tenantSlug: 'tenant-slug' },
    },
    {
      reason: 'principal is missing tenantSlug',
      authResult: { apiKeyId: 'api-key-id', tenantId: 'tenant-id' },
    },
  ])('rejects request when $reason', async ({ authResult }) => {
    service.authenticate.mockResolvedValue(
      authResult as ApiKeyPrincipal | null,
    );
    const { context } = createExecutionContext({
      'x-api-key': 'sk_test_raw',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
