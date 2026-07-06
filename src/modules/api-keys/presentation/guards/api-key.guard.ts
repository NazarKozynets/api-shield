import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiKeyPrincipal, ApiKeysService } from '../../application/services/api-keys.service';
import { AppLogger } from 'src/common/logger/app.logger';

type AuthenticatedFastifyRequest = FastifyRequest & {
  auth?: ApiKeyPrincipal;
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new AppLogger(ApiKeyGuard.name);

  constructor(
    private readonly service: ApiKeysService
  ) { }

  // Validate api key and set auth in request object
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedFastifyRequest>();

    const rawApiKey = this.extractApiKey(request);

    const authResult: ApiKeyPrincipal | null = await this.service.authenticate(rawApiKey);
    this.logger.debug(`ApiKeyPrincipal authResult: ${JSON.stringify(authResult, null, '\t')}`);

    if (
      !authResult ||
      !authResult.apiKeyId ||
      !authResult.tenantId ||
      !authResult.tenantSlug
    ) {
      this.logger.warn('Not enough info in authResult', JSON.stringify(authResult, null, '\t'));
      throw new UnauthorizedException('Invalid API Key.');
    }

    request.auth = authResult;

    return true;
  }

  // Extracts API Key from request headers
  private extractApiKey(request: FastifyRequest): string {
    const headerValue = request.headers['x-api-key'];

    if (!headerValue) {
      throw new UnauthorizedException('API key is required.');
    }

    if (Array.isArray(headerValue)) {
      if (!headerValue[0]) {
        throw new UnauthorizedException('API key is required.');
      }

      return headerValue[0];
    }

    if (typeof headerValue !== 'string') {
      throw new UnauthorizedException('Invalid API key format.');
    }

    return headerValue;
  }
}
