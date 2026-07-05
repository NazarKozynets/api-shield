import { TenantStatus } from '../enums/tenant.enum';

type TenantProps = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
};

// Domain entity for tenant
export class TenantEntity {
  constructor(private readonly props: TenantProps) {}

  static restore(props: TenantProps): TenantEntity {
    return new TenantEntity(props);
  }

  public isActive(): boolean {
    return this.props.status === TenantStatus.ACTIVE;
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get status(): TenantStatus {
    return this.props.status;
  }
}
