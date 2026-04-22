import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Company } from '@infra/database/entities/administration/company.entity';
import { generateId } from '@infra/common/utils/id-generator.util';
import { CompanyInfoDto, CompanyInfoListDto, SearchCompanyDto } from './dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  async getListCompanyInfo(dto: SearchCompanyDto): Promise<CompanyInfoListDto> {
    const { searchText, pagination, sort, sorts, coId, coNm, useFlg, taxCd, coTpCd, coNtn } = dto;

    const qb = this.companyRepository.createQueryBuilder('co');

    // Full-text search across coId, coNm, taxCd
    if (searchText?.trim()) {
      const term = `%${searchText.trim()}%`;
      qb.andWhere(
        '(co.coId ILIKE :term OR co.coNm ILIKE :term OR co.taxCd ILIKE :term)',
        { term },
      );
    }

    // Exact field filters
    if (coId) {
      qb.andWhere('co.coId = :coId', { coId });
    }
    if (coNm) {
      qb.andWhere('co.coNm ILIKE :coNm', { coNm: `%${coNm}%` });
    }
    if (taxCd) {
      qb.andWhere('co.taxCd = :taxCd', { taxCd });
    }
    if (coTpCd) {
      qb.andWhere('co.coTpCd = :coTpCd', { coTpCd });
    }
    if (coNtn) {
      qb.andWhere('co.coNtn = :coNtn', { coNtn });
    }
    if (useFlg !== undefined && useFlg !== null) {
      qb.andWhere('co.useFlg = :useFlg', { useFlg });
    }

    // Sorting — multi-sort takes precedence, then single sort
    const appliedSorts = sorts?.length ? sorts : sort ? [sort] : [];
    if (appliedSorts.length) {
      const ALLOWED_FIELDS: Record<string, string> = {
        coId: 'co.coId',
        coNm: 'co.coNm',
        taxCd: 'co.taxCd',
        coTpCd: 'co.coTpCd',
        coNtn: 'co.coNtn',
        createdAt: 'co.createdAt',
        updatedAt: 'co.updatedAt',
      };
      for (const s of appliedSorts) {
        if (s.sortField && ALLOWED_FIELDS[s.sortField]) {
          qb.addOrderBy(ALLOWED_FIELDS[s.sortField], s.sortType ?? 'ASC');
        }
      }
    } else {
      qb.orderBy('co.createdAt', 'DESC');
    }

    // Pagination
    const pageSize = pagination?.pageSize ?? 10;
    const current = pagination?.current ?? 1;
    qb.skip((current - 1) * pageSize).take(pageSize);

    const [companies, total] = await qb.getManyAndCount();

    return {
      companyInfo: companies.map((c) => this.toDto(c)),
      total,
    };
  }

  async getCompanyInfo(dto: SearchCompanyDto): Promise<CompanyInfoDto | null> {
    const { coId, searchText } = dto;

    const qb = this.companyRepository.createQueryBuilder('co');

    if (coId) {
      qb.andWhere('co.coId = :coId', { coId });
    } else if (searchText?.trim()) {
      qb.andWhere('co.coNm ILIKE :term', { term: `%${searchText.trim()}%` });
    } else {
      return null;
    }

    const company = await qb.getOne();
    return company ? this.toDto(company) : null;
  }

  async createCompany(dto: CompanyInfoDto): Promise<void> {
    // Validate coId uniqueness
    if (dto.coId) {
      const existing = await this.companyRepository.findOne({ where: { coId: dto.coId } });
      if (existing) {
        throw new BadRequestException('ADM000016');
      }
    }

    // Validate taxCd uniqueness if provided
    if (dto.taxCd) {
      const existingTax = await this.companyRepository.findOne({ where: { taxCd: dto.taxCd } });
      if (existingTax) {
        throw new BadRequestException('ADM000017');
      }
    }

    // Generate company ID
    const coId = await generateId(this.dataSource, 'CO', 'seq_co');

    const company = this.companyRepository.create({
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
    });

    await this.companyRepository.save(company);
  }

  async updateCompany(dto: CompanyInfoDto): Promise<void> {
    if (!dto.coId) {
      throw new BadRequestException('ADM000104');
    }

    const existing = await this.companyRepository.findOne({ where: { coId: dto.coId } });
    if (!existing) {
      throw new NotFoundException('ADM000104');
    }

    // Validate taxCd uniqueness against other companies if taxCd is changing
    if (dto.taxCd && dto.taxCd !== existing.taxCd) {
      const taxConflict = await this.companyRepository
        .createQueryBuilder('co')
        .where('co.taxCd = :taxCd', { taxCd: dto.taxCd })
        .andWhere('co.coId != :coId', { coId: dto.coId })
        .getOne();

      if (taxConflict) {
        throw new BadRequestException('ADM000107');
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

    await this.companyRepository.save({ ...existing, ...merged });
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
