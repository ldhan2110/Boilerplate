import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role, RoleAuth } from '@infra/database/entities/administration';
import { generateId } from '@infra/common/utils/id-generator.util';
import { RoleAuthDto, RoleDto, RoleListDto, SearchRoleDto } from './dto';
import { SuccessDto } from '@infra/common/dtos';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(RoleAuth)
    private readonly roleAuthRepository: Repository<RoleAuth>,

    private readonly dataSource: DataSource,
  ) {}

  async getRoleList(dto: SearchRoleDto): Promise<RoleListDto> {
    const { roleCd, roleNm, useFlg } = dto as SearchRoleDto & {
      roleCd?: string;
      roleNm?: string;
      useFlg?: boolean;
    };

    const pagination = dto.pagination;
    const pageSize = pagination?.pageSize ?? 10;
    const current = pagination?.current ?? 1;
    const offset = (current - 1) * pageSize;

    const sort = dto.sort;
    const sortField = sort?.sortField ?? 'updatedAt';
    const sortType = (sort?.sortType ?? 'DESC') as 'ASC' | 'DESC';

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .select([
        'role.roleId',
        'role.roleCd',
        'role.roleNm',
        'role.roleDesc',
        'role.useFlg',
        'role.createdBy',
        'role.updatedBy',
        'role.createdAt',
        'role.updatedAt',
      ]);

    if (roleCd) {
      qb.andWhere('role.roleCd = :roleCd', { roleCd });
    }

    if (roleNm) {
      qb.andWhere('role.roleNm ILIKE :roleNm', { roleNm: `%${roleNm}%` });
    }

    if (useFlg !== undefined && useFlg !== null) {
      qb.andWhere('role.useFlg = :useFlg', { useFlg });
    }

    const fieldMap: Record<string, string> = {
      updatedAt: 'role.updatedAt',
      createdAt: 'role.createdAt',
      roleCd: 'role.roleCd',
      roleNm: 'role.roleNm',
    };

    const orderColumn = fieldMap[sortField] ?? 'role.updatedAt';
    qb.orderBy(orderColumn, sortType);

    const [roles, total] = await qb.skip(offset).take(pageSize).getManyAndCount();

    const roleList: RoleDto[] = roles.map((r) => ({
      roleId: r.roleId,
      roleCd: r.roleCd,
      roleNm: r.roleNm,
      roleDesc: r.roleDesc,
      useFlg: r.useFlg,
      createdBy: r.createdBy,
      updatedBy: r.updatedBy,
    }));

    return { roleList, total };
  }

  async getRole(dto: SearchRoleDto): Promise<RoleDto> {
    const { roleId, roleCd } = dto;

    const roleQb = this.roleRepository
      .createQueryBuilder('role')
      .select([
        'role.roleId',
        'role.roleCd',
        'role.roleNm',
        'role.roleDesc',
        'role.useFlg',
        'role.createdBy',
        'role.updatedBy',
      ]);

    if (roleId) {
      roleQb.where('role.roleId = :roleId', { roleId });
    } else if (roleCd) {
      roleQb.where('role.roleCd = :roleCd', { roleCd });
    }

    const role = await roleQb.getOne();

    if (!role) {
      return {} as RoleDto;
    }

    const authRows: Array<{
      role_id: string;
      role_cd: string;
      perm_id: string;
      perm_cd: string;
      pgm_id: string;
      pgm_cd: string;
      pgm_tp_cd: string;
      active_yn: boolean;
    }> = await this.dataSource.query(
      `SELECT auth.role_id,
              role.role_cd,
              perm.perm_id,
              perm.perm_cd,
              pgm.pgm_id,
              pgm.pgm_cd,
              pgm.pgm_tp_cd,
              auth.active_yn
       FROM adm_role_auth auth
       LEFT JOIN adm_role role ON auth.role_id = role.role_id
       LEFT JOIN com_pgm  pgm  ON auth.pgm_id  = pgm.pgm_id
       LEFT JOIN com_perm perm ON auth.perm_id  = perm.perm_id
       WHERE auth.role_id = $1`,
      [role.roleId],
    );

    const roleAuthList: RoleAuthDto[] = authRows.map((row) => ({
      roleId: row.role_id,
      pgmId: row.pgm_id,
      pgmCd: row.pgm_cd,
      pgmTpCd: row.pgm_tp_cd,
      permId: row.perm_id,
      permCd: row.perm_cd,
      activeYn: row.active_yn,
    }));

    return {
      roleId: role.roleId,
      roleCd: role.roleCd,
      roleNm: role.roleNm,
      roleDesc: role.roleDesc,
      useFlg: role.useFlg,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
      roleAuthList,
    };
  }

  async insertRole(dto: RoleDto): Promise<SuccessDto> {
    const { roleCd, roleNm, roleDesc, useFlg, createdBy, updatedBy, roleAuthList } = dto;

    const existing = await this.roleRepository.findOne({ where: { roleCd } });
    if (existing) {
      throw new BadRequestException('ADM000010');
    }

    const roleId = await generateId(this.dataSource, 'ROLE', 'seq_role');

    const role = this.roleRepository.create({
      roleId,
      roleCd,
      roleNm,
      roleDesc,
      useFlg: useFlg ?? true,
      createdBy: createdBy ?? 'SYSTEM',
      updatedBy: updatedBy ?? createdBy ?? 'SYSTEM',
    });

    await this.roleRepository.save(role);

    if (roleAuthList && roleAuthList.length > 0) {
      for (const item of roleAuthList) {
        const auth = this.roleAuthRepository.create({
          roleId,
          pgmId: item.pgmId,
          permId: item.permId,
          activeYn: item.activeYn ?? true,
          createdBy: createdBy ?? 'SYSTEM',
          updatedBy: updatedBy ?? createdBy ?? 'SYSTEM',
        });
        await this.roleAuthRepository.save(auth);
      }
    }

    return SuccessDto.of(true);
  }

  async updateRole(dto: RoleDto): Promise<SuccessDto> {
    const { roleId, roleCd, roleNm, roleDesc, useFlg, updatedBy, roleAuthList } = dto;

    await this.roleRepository.update(
      { roleId },
      {
        roleCd,
        roleNm,
        roleDesc,
        useFlg,
        updatedBy: updatedBy ?? 'SYSTEM',
      },
    );

    await this.dataSource.query(
      `DELETE FROM adm_role_auth WHERE role_id = $1`,
      [roleId],
    );

    if (roleAuthList && roleAuthList.length > 0) {
      for (const item of roleAuthList) {
        await this.dataSource.query(
          `INSERT INTO adm_role_auth (role_id, pgm_id, perm_id, active_yn, cre_usr_id, upd_usr_id, cre_dt, upd_dt)
           VALUES ($1, $2, $3, $4, $5, $5, NOW(), NOW())
           ON CONFLICT (role_id, pgm_id, perm_id)
           DO UPDATE SET
             active_yn   = $4,
             upd_usr_id  = $5,
             upd_dt      = NOW()`,
          [roleId, item.pgmId, item.permId, item.activeYn ?? true, updatedBy ?? 'SYSTEM'],
        );
      }
    }

    return SuccessDto.of(true);
  }
}
