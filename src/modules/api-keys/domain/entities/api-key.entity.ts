import { ApiKeyStatus } from '../enums/api-key.enum';

type ApiKeyProps = {
  id: string;
  tenantId: string;

  name: string;
  keyPrefix: string;
  keyHash: string;

  status: ApiKeyStatus;

  expiresAt: Date | null;
  revokedAt: Date | null;
};

// Domain entity for api key
export class ApiKeyEntity {
  constructor(private readonly props: ApiKeyProps) {}

  static restore(props: ApiKeyProps): ApiKeyEntity {
    return new ApiKeyEntity(props);
  }

  public isActive(now = new Date()): boolean {
    if (this.props.status !== ApiKeyStatus.ACTIVE) return false;
    if (this.props.revokedAt) return false;
    if (this.props.expiresAt && this.props.expiresAt <= now) return false;

    return true;
  }

  public isExpired(now = new Date()): boolean {
    return Boolean(this.props.expiresAt && this.props.expiresAt <= now);
  }

  public get id(): string {
    return this.props.id;
  }

  public get tenantId(): string {
    return this.props.tenantId;
  }

  public get name(): string {
    return this.props.name;
  }

  public get keyPrefix(): string {
    return this.props.keyPrefix;
  }

  public get keyHash(): string {
    return this.props.keyHash;
  }

  public get status(): ApiKeyStatus {
    return this.props.status;
  }

  public get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  public get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
}
