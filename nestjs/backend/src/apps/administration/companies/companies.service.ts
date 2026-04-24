import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { Company } from '@infra/database/entities/administration';
import { QueryFactory } from '@infra/database/query-factory';
import { CompanyInfoDto, CompanyInfoListDto, SearchCompanyDto } from './dto';

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

    // Validate taxCd uniqueness if provided
    if (dto.taxCd) {
      const existingTax = await this.qf.findOne(Company, { taxCd: dto.taxCd });
      if (existingTax) {
        throw new BizException('ADM000017', 'ERROR');
      }
    }

    await this.qf.transaction(async (tx) => {
      const coId = await tx.genId('CO', 'seq_co');

      await tx.insert(Company).values({
        coId,
        coNm: dto.coNm,
        coTpCd: dto.coTpCd,
        coFrgnNm: dto.coFrgnNm,
        taxCd: dto.taxCd,
        taxOfc: dto.taxOfc,
        coLoclNm: dto.coLoclNm,
        coAddrVal1: dto.coAddrVal1,
        coAddrVal2: dto.coAddrVal2,
        coAddrVal3: dto.coAddrVal3,
        emlAddr: dto.emlAddr,
        faxNo: dto.faxNo,
        phnNo: dto.phnNo,
        slRep: dto.slRep,
        webAddr: dto.webAddr,
        coDesc: dto.coDesc,
        coAnvDt: dto.coAnvDt ? new Date(dto.coAnvDt) : undefined,
        coSz: dto.coSz,
        coNtn: dto.coNtn,
        empeSz: dto.empeSz,
        currCd: dto.currCd,
        coIndusZn: dto.coIndusZn,
        coProd: dto.coProd,
        tmZn: dto.tmZn ?? 'Asia/Ho_Chi_Minh',
        bankTpCd: dto.bankTpCd,
        bankAcctNo: dto.bankAcctNo,
        bankNm: dto.bankNm,
        chtrCapiVal: dto.chtrCapiVal ? Number(dto.chtrCapiVal) : undefined,
        estbDt: dto.estbDt ? new Date(dto.estbDt) : undefined,
        lgoFileId: dto.lgoFileId || undefined,
        useFlg: dto.useFlg ?? true,
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

    // Validate taxCd uniqueness against other companies if taxCd is changing
    if (dto.taxCd && dto.taxCd !== existing.taxCd) {
      const taxConflict = await this.qf
        .select(Company, 'co')
        .whereStrict('co.taxCd = :taxCd', { taxCd: dto.taxCd })
        .whereStrict('co.coId != :coId', { coId: dto.coId })
        .getOne();

      if (taxConflict) {
        throw new BizException('ADM000107', 'ERROR');
      }
    }

    // Partial update: preserve existing values for null/undefined fields.
    // Special rule for lgoFileId: empty string clears it, null preserves it.
    const merged: Partial<Company> = {
      coNm: dto.coNm ?? existing.coNm,
      coTpCd: dto.coTpCd ?? existing.coTpCd,
      coFrgnNm: dto.coFrgnNm ?? existing.coFrgnNm,
      taxCd: dto.taxCd ?? existing.taxCd,
      taxOfc: dto.taxOfc ?? existing.taxOfc,
      coLoclNm: dto.coLoclNm ?? existing.coLoclNm,
      coAddrVal1: dto.coAddrVal1 ?? existing.coAddrVal1,
      coAddrVal2: dto.coAddrVal2 ?? existing.coAddrVal2,
      coAddrVal3: dto.coAddrVal3 ?? existing.coAddrVal3,
      emlAddr: dto.emlAddr ?? existing.emlAddr,
      faxNo: dto.faxNo ?? existing.faxNo,
      phnNo: dto.phnNo ?? existing.phnNo,
      slRep: dto.slRep ?? existing.slRep,
      webAddr: dto.webAddr ?? existing.webAddr,
      coDesc: dto.coDesc ?? existing.coDesc,
      coAnvDt: dto.coAnvDt !== undefined ? new Date(dto.coAnvDt) : existing.coAnvDt,
      coSz: dto.coSz ?? existing.coSz,
      coNtn: dto.coNtn ?? existing.coNtn,
      empeSz: dto.empeSz ?? existing.empeSz,
      currCd: dto.currCd ?? existing.currCd,
      coIndusZn: dto.coIndusZn ?? existing.coIndusZn,
      coProd: dto.coProd ?? existing.coProd,
      tmZn: dto.tmZn ?? existing.tmZn,
      bankTpCd: dto.bankTpCd ?? existing.bankTpCd,
      bankAcctNo: dto.bankAcctNo ?? existing.bankAcctNo,
      bankNm: dto.bankNm ?? existing.bankNm,
      chtrCapiVal: dto.chtrCapiVal !== undefined ? Number(dto.chtrCapiVal) : existing.chtrCapiVal,
      estbDt: dto.estbDt !== undefined ? new Date(dto.estbDt) : existing.estbDt,
      // empty string = clear; null = preserve existing; value = set new value
      lgoFileId:
        dto.lgoFileId === ''
          ? undefined
          : dto.lgoFileId === null || dto.lgoFileId === undefined
            ? existing.lgoFileId
            : dto.lgoFileId,
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
    dto.coTpCd = company.coTpCd;
    dto.coFrgnNm = company.coFrgnNm;
    dto.taxCd = company.taxCd;
    dto.taxOfc = company.taxOfc;
    dto.coLoclNm = company.coLoclNm;
    dto.coAddrVal1 = company.coAddrVal1;
    dto.coAddrVal2 = company.coAddrVal2;
    dto.coAddrVal3 = company.coAddrVal3;
    dto.emlAddr = company.emlAddr;
    dto.faxNo = company.faxNo;
    dto.phnNo = company.phnNo;
    dto.slRep = company.slRep;
    dto.webAddr = company.webAddr;
    dto.coDesc = company.coDesc;
    dto.coAnvDt = company.coAnvDt ? company.coAnvDt.toISOString().split('T')[0] : undefined;
    dto.coSz = company.coSz;
    dto.coNtn = company.coNtn;
    dto.empeSz = company.empeSz;
    dto.currCd = company.currCd;
    dto.coIndusZn = company.coIndusZn;
    dto.coProd = company.coProd;
    dto.tmZn = company.tmZn;
    dto.bankTpCd = company.bankTpCd;
    dto.bankAcctNo = company.bankAcctNo;
    dto.bankNm = company.bankNm;
    dto.chtrCapiVal = company.chtrCapiVal !== null && company.chtrCapiVal !== undefined
      ? String(company.chtrCapiVal)
      : undefined;
    dto.estbDt = company.estbDt ? company.estbDt.toISOString().split('T')[0] : undefined;
    dto.lgoFileId = company.lgoFileId;
    dto.useFlg = company.useFlg;
    dto.createdBy = company.createdBy;
    dto.updatedBy = company.updatedBy;
    return dto;
  }
}
