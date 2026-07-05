import { TenantEntity } from 'src/modules/tenants/domain/entities/tenant.entity';
import { ApiKeyEntity } from '../entities/api-key.entity';

export const API_KEYS_REPOSITORY = Symbol('API_KEYS_REPOSITORY');

export type ApiKeyWithTenant = {
  apiKey: ApiKeyEntity;
  tenant: TenantEntity;
};

export interface ApiKeysRepository {
  findByHash(keyHash: string): Promise<ApiKeyEntity | null>;

  findByHashWithTenant(keyHash: string): Promise<ApiKeyWithTenant | null>;
}
