import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  API_KEYS_REPOSITORY,
  type ApiKeysRepository,
} from '../../domain/repositories/api-keys.repository';

export type ApiKeyPrincipal = {
  apiKeyId: string;
  tenantId: string;
  tenantSlug: string;
};

@Injectable()
export class ApiKeysService {
  constructor(
    @Inject(API_KEYS_REPOSITORY)
    private readonly apiKeysRepository: ApiKeysRepository,
  ) {}

  async authenticate(keyHash: string): Promise<ApiKeyPrincipal | null> {
    const apiKeyWithTenant =
      await this.apiKeysRepository.findByHashWithTenant(keyHash);

    if (!apiKeyWithTenant) {
      throw new UnauthorizedException('Invalid API key');
    }

    const { apiKey, tenant } = apiKeyWithTenant;

    if (!apiKey) {
      throw new NotFoundException(`API Key not found.`);
    }
    if (!tenant) {
      throw new NotFoundException(`Tenant not found`);
    }

    // API Key rules
    if (!apiKey.isActive()) {
      throw new UnauthorizedException(`API Key is not active`);
    }
    if (apiKey.isExpired()) {
      throw new UnauthorizedException(`API Key is expired`);
    }

    // Tenant rules
    if (!tenant.isActive()) {
      throw new ForbiddenException(`Tenant is not active`);
    }

    return {
      apiKeyId: apiKey.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };
  }
}
