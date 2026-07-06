import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantStatus as PrismaTenantStatus } from '@prisma/client';
import { TenantStatus } from '../../domain/enums/tenant.enum';

type PrismaTenantPersistence = {
  id: string;
  name: string;
  slug: string;
  status: PrismaTenantStatus;
};

export class TenantMapper {
  static toDomain<T extends PrismaTenantPersistence>(raw: T): TenantEntity {
    return TenantEntity.restore({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      status: this.mapStatusToDomain(raw.status),
    });
  }

  // Maps persistence enum to domain
  static mapStatusToDomain(status: PrismaTenantStatus): TenantStatus {
    switch (status) {
      case PrismaTenantStatus.ACTIVE:
        return TenantStatus.ACTIVE;
      case PrismaTenantStatus.SUSPENDED:
        return TenantStatus.SUSPENDED;
      case PrismaTenantStatus.DELETED:
        return TenantStatus.DELETED;
    }
  }
}
