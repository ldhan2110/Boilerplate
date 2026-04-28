import { Inject, Injectable } from '@nestjs/common';
import { QueryFactory } from '@infra/database/query-factory/query-factory.service';
import { METADATA_QUERY_FACTORY } from './metadata-query-factory';
import { TenantDbConfig } from './entities/tenant-db-config.entity';
import { TenantMaster } from './entities/tenant-master.entity';

@Injectable()
export class TenantMetadataService {
  constructor(
    @Inject(METADATA_QUERY_FACTORY) private readonly qf: QueryFactory,
  ) {}

  async getTenantDbConfig(tenantId: string): Promise<TenantDbConfig | null> {
    return this.qf
      .select(TenantDbConfig, 'cfg')
      .innerJoin(TenantMaster, 'mst', 'cfg.tent_id = mst.tent_id')
      .andWhereStrict('mst.tentId = :tenantId', { tenantId })
      .andWhereStrict('mst.useFlg = true')
      .andWhereStrict('cfg.useFlg = true')
      .andWhereStrict('cfg.priority = 1')
      .getOne();
  }

  async isTenantActive(tenantId: string): Promise<boolean> {
    const count = await this.qf
      .select(TenantMaster, 'mst')
      .andWhereStrict('mst.tentId = :tenantId', { tenantId })
      .andWhereStrict('mst.useFlg = true')
      .getCount();
    return count > 0;
  }
}
