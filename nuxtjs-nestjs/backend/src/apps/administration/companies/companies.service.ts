import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { Company } from '@infra/database/entities/administration';
import { QueryFactory } from '@infra/database/query-factory';
import { LogService } from '@infra/logger';
import { CompanyInfoDto, CompanyInfoListDto, SearchCompanyDto } from './dto';

@LogService()
@Injectable()
export class CompaniesService {
  constructor(private readonly qf: QueryFactory) {}

  async getListCompanyInfo(dto: SearchCompanyDto): Promise<CompanyInfoListDto> {
    const { searchText, pagination, sort, sorts, coId, coNm, useFlg, taxCd, coTpCd, coNtn } = dto;

    const ALLOWED_FIELDS: Record<string, string> = {
      coId: 'co.coId',
      coNm: 'co.coNm',
      taxCd: 'co.taxCd',
      coTpCd: 'co.coTpCd',
      coNtn: 'co.coNtn',
      createdAt: 'co.createdAt',
      updatedAt: 'co.updatedAt',
    };

    // Multi-sort takes precedence, then single sort
    const appliedSorts = sorts?.length ? sorts : sort ? [sort] : undefined;

    const chain = this.qf.select(Company, 'co');

    // Full-text search across coId, coNm, taxCd — uses parenthesized OR so we
    // must drop down to the escape hatch for this one condition only.
    if (searchText?.trim()) {
      const term = `%${searchText.trim()}%`;
      chain.getQueryBuilder().andWhere(
        '(co.coId ILIKE :term OR co.coNm ILIKE :term OR co.taxCd ILIKE :term)',
        { term },
      );
    }

    const [companies, total] = await chain
      .andWhere('co.coId = :coId', { coId: coId || undefined })
      .andWhere('co.coNm ILIKE :coNm', { coNm: coNm ? `%${coNm}%` : undefined })
      .andWhere('co.taxCd = :taxCd', { taxCd: taxCd || undefined })
      .andWhere('co.coTpCd = :coTpCd', { coTpCd: coTpCd || undefined })
      .andWhere('co.coNtn = :coNtn', { coNtn: coNtn || undefined })
      .andWhere(
        'co.useFlg = :useFlg',
        { useFlg: useFlg !== undefined && useFlg !== null ? useFlg : undefined },
      )
      .orderByMany(appliedSorts, ALLOWED_FIELDS, { default: ['co.createdAt', 'DESC'] })
      .paginate(pagination)
      .getManyAndCount();

    return {
      companyInfo: companies.map((c) => this.toDto(c)),
      total,
    };
  }

  async getCompanyInfo(dto: SearchCompanyDto): Promise<CompanyInfoDto | null> {
    const { coId, searchText } = dto;

    if (!coId && !searchText?.trim()) {
      return null;
    }

    const chain = this.qf.select(Company, 'co');

    if (coId) {
      chain.whereStrict('co.coId = :coId', { coId });
    } else {
      chain.whereStrict('co.coNm ILIKE :term', { term: `%${searchText!.trim()}%` });
    }

    const company = await chain.getOne();
    return company ? this.toDto(company) : null;
  }

  async createCompany(dto: CompanyInfoDto): Promise<void> {
    // Validate coId uniqueness
    if (dto.coId) {
      const existing = await this.qf.findOne(Company, { coId: dto.coId });
      if (existing) {
        throw new BizException('ADM000016', 'ERROR');
      }
    }

    await this.qf.transaction(async (tx) => {
      const coId = await tx.genId('CO', 'seq_co');

      await tx.insert(Company).values({
        coId,
        coNm: dto.coNm,
        tmZn: dto.tmZn,
        useFlg: dto.useFlg ?? 'Y',
        createdBy: dto.createdBy ?? 'SYSTEM',
        updatedBy: dto.updatedBy ?? 'SYSTEM',
      }).execute();
    });
  }

  async updateCompany(dto: CompanyInfoDto): Promise<void> {
    if (!dto.coId) {
      throw new BizException('ADM000104', 'ERROR');
    }

    const existing = await this.qf.findOne(Company, { coId: dto.coId });
    if (!existing) {
      throw new BizException('ADM000104', 'ERROR');
    }

    // Partial update: preserve existing values for null/undefined fields.
    // Special rule for lgoFileId: empty string clears it, null preserves it.
    const merged: Partial<Company> = {
      coNm: dto.coNm ?? existing.coNm,
      useFlg: dto.useFlg ?? existing.useFlg,
      updatedBy: dto.updatedBy ?? 'SYSTEM',
    };

    await this.qf.transaction(async (tx) => {
      await tx.update(Company).where({ coId: dto.coId }).set(merged as any).execute();
    });
  }

  private toDto(company: Company): CompanyInfoDto {
    const dto = new CompanyInfoDto();
    dto.coId = company.coId;
    dto.coNm = company.coNm;
    dto.useFlg = company.useFlg;
    dto.tmZn = company.tmZn;
    dto.createdBy = company.createdBy;
    dto.updatedBy = company.updatedBy;
    return dto;
  }
}
