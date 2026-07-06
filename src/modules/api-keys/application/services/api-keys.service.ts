import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  API_KEYS_REPOSITORY,
  type ApiKeysRepository,
} from '../../domain/repositories/api-keys.repository';
import { hashApiKey } from '../../infrastructure/crypto/api-key.hasher';

export type ApiKeyPrincipal = {
  apiKeyId: string;
  tenantId: string;
  tenantSlug: string;
};

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    @Inject(API_KEYS_REPOSITORY)
    private readonly apiKeysRepository: ApiKeysRepository,
  ) { }

  async authenticate(rawApiKey: string): Promise<ApiKeyPrincipal | null> {
    // Hashing api key
    const keyHash = hashApiKey(rawApiKey);
    
    const apiKeyWithTenant =
      await this.apiKeysRepository.findByHashWithTenant(keyHash);

    if (!apiKeyWithTenant) {
      this.logger.warn(`API Key (apiKeyWithTenant) was not found, ${apiKeyWithTenant}`)
      throw new NotFoundException('API Key not found.')
    }

    const apiKeyObject = apiKeyWithTenant.apiKey;
    const tenantObject = apiKeyWithTenant.tenant;

    if (!apiKeyObject) {
      this.logger.warn(`API Key (apiKeyObject) was not found. apiKeyWithTenant object: ${JSON.stringify(apiKeyWithTenant, null, '\t')}`);
      throw new NotFoundException(`API Key not found.`);
    }
    if (!tenantObject) {
      this.logger.warn(`Tenant (tenantObject) was not found. apiKeyWithTenant object: ${JSON.stringify(apiKeyWithTenant, null, '\t')}`);
      throw new NotFoundException(`Tenant not found.`);
    }

    // API Key rules
    if (!apiKeyObject.isActive()) {
      this.logger.warn(`
          Attempt to use an unactive API Key.
          \nTenant: ${JSON.stringify({
        name: tenantObject.name,
        isActive: tenantObject.isActive,
        tenantId: tenantObject.id,
      }, null, '\t')}
      \nAPI Key: ${JSON.stringify({
        name: apiKeyObject.name,
        isActive: apiKeyObject.isActive,
        isExpired: apiKeyObject.isExpired,
        id: apiKeyObject.id,
      }, null, '\t')}
        `);
      throw new UnauthorizedException(`API Key is not active.`);
    }
    if (apiKeyObject.isExpired()) {
      this.logger.warn(`
          Attempt to use an expired API Key.
          \nTenant: ${JSON.stringify({
        name: tenantObject.name,
        isActive: tenantObject.isActive,
        tenantId: tenantObject.id,
      }, null, '\t')}
      \nAPI Key: ${JSON.stringify({
        name: apiKeyObject.name,
        isActive: apiKeyObject.isActive,
        isExpired: apiKeyObject.isExpired,
        id: apiKeyObject.id,
      }, null, '\t')}
        `);
      throw new UnauthorizedException(`API Key is expired.`);
    }

    // Tenant rules
    if (!tenantObject.isActive()) {
      this.logger.warn(`
          Attempt to use an API Key of unactive tenant.
          \nTenant: ${JSON.stringify({
        name: tenantObject.name,
        isActive: tenantObject.isActive,
        tenantId: tenantObject.id
      }, null, '\t')}
      \nAPI Key: ${JSON.stringify({
        name: apiKeyObject.name,
        isActive: apiKeyObject.isActive,
        isExpired: apiKeyObject.isExpired,
        id: apiKeyObject.id,
      }, null, '\t')}
        `);
      throw new ForbiddenException(`Tenant is not active.`);
    }

    return {
      apiKeyId: apiKeyObject.id,
      tenantId: tenantObject.id,
      tenantSlug: tenantObject.slug,
    };
  }
}
