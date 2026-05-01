import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { Role, RoleAuth } from '@infra/database/entities/administration';
import { QueryFactory } from '@infra/database/query-factory';
import { RoleAuthDto, RoleDto, RoleListDto, SearchRoleDto } from './dto';
import { SuccessDto } from '@infra/common/dto';
import { LogService } from '@infra/logger';

@LogService()
@Injectable()
export class RolesService {
  constructor(private readonly qf: QueryFactory) {}

  async getRoleList(dto: SearchRoleDto): Promise<RoleListDto> {
    const { roleCd, roleNm, useFlg } = dto as SearchRoleDto & {
      roleCd?: string;
      roleNm?: string;
      useFlg?: boolean;
    };

    const ALLOWED_FIELDS: Record<string, string> = {
      updatedAt: 'role.updatedAt',
      createdAt: 'role.createdAt',
      roleCd: 'role.roleCd',
      roleNm: 'role.roleNm',
    };

    const columns = [
      'role.roleId',
      'role.roleCd',
      'role.roleNm',
      'role.roleDesc',
      'role.useFlg',
      'role.createdBy',
      'role.updatedBy',
      'role.createdAt',
      'role.updatedAt',
    ];

    const [roles, total] = await this.qf
      .select(Role, 'role', columns)
      .andWhere('role.roleCd = :roleCd', { roleCd: roleCd || undefined })
      .andWhere('role.roleNm ILIKE :roleNm', { roleNm: roleNm ? `%${roleNm}%` : undefined })
      .andWhere(
        'role.useFlg = :useFlg',
        { useFlg: useFlg !== undefined && useFlg !== null ? useFlg : undefined },
      )
      .orderByMany(
        dto.sort ? [dto.sort] : undefined,
        ALLOWED_FIELDS,
        { default: ['role.updatedAt', 'DESC'] },
      )
      .paginate(dto.pagination)
      .getManyAndCount();

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

    const roleColumns = [
      'role.roleId',
      'role.roleCd',
      'role.roleNm',
      'role.roleDesc',
      'role.useFlg',
      'role.createdBy',
      'role.updatedBy',
    ];

    const chain = this.qf.select(Role, 'role', roleColumns);

    if (roleId) {
      chain.whereStrict('role.roleId = :roleId', { roleId });
    } else if (roleCd) {
      chain.whereStrict('role.roleCd = :roleCd', { roleCd });
    }

    const role = await chain.getOne();

    if (!role) {
      return {} as RoleDto;
    }

    const authRows = await this.qf.raw<{
      role_id: string;
      role_cd: string;
      perm_id: string;
      perm_cd: string;
      pgm_id: string;
      pgm_cd: string;
      pgm_tp_cd: string;
      active_yn: boolean;
    }>(
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
       LEFT JOIN com_perm perm ON auth.perm_id  = perm.perm_id`,
    ).where('role_id = :roleId', { roleId: role.roleId })
     .execute();

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
    const { roleCd, roleNm, roleDesc, useFlg, roleAuthList } = dto;

    const existing = await this.qf.findOne(Role, { roleCd });
    if (existing) {
      throw new BizException('ADM000010', 'ERROR');
    }

    await this.qf.transaction(async (tx) => {
      const saved = await tx.insert(Role).values({
        roleCd,
        roleNm,
        roleDesc,
        useFlg: useFlg ?? 'Y',
      }).returning<Role>().execute();

      if (roleAuthList && roleAuthList.length > 0) {
        for (const item of roleAuthList) {
          await tx.insert(RoleAuth).values({
            roleId: saved.roleId,
            pgmId: item.pgmId,
            permId: item.permId,
            activeYn: item.activeYn ?? true,
          }).execute();
        }
      }
    });

    return SuccessDto.of(true);
  }

  async updateRole(dto: RoleDto): Promise<SuccessDto> {
    const { roleId, roleCd, roleNm, roleDesc, useFlg, roleAuthList } = dto;

    await this.qf.transaction(async (tx) => {
      await tx.update(Role).where({ roleId }).set({
        roleCd,
        roleNm,
        roleDesc,
        useFlg,
      }).execute();

      await tx.delete(RoleAuth).where({ roleId }).execute();

      if (roleAuthList && roleAuthList.length > 0) {
        for (const item of roleAuthList) {
          await tx.insert(RoleAuth).values({
            roleId,
            pgmId: item.pgmId,
            permId: item.permId,
            activeYn: item.activeYn ?? true,
          }).execute();
        }
      }
    });

    return SuccessDto.of(true);
  }
}
