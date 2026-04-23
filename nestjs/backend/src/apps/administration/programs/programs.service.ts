import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
import {
  Permission,
  Program,
  Role,
  RoleAuth,
} from '@infra/database/entities/administration';
import { QueryFactory, TransactionContext } from '@infra/database/query-factory';
import { PermissionDto, ProgramDto, ProgramListDto, SearchProgramDto } from './dto';

// ─── Domain constants ────────────────────────────────────────────────────────
const VIEW_PERMISSION = 'VIEW';
const VIEW_PERMISSION_NAME = 'View Page';
const SUPERADMIN_ROLE = 'SUPERADMIN';

// ─── Error codes ─────────────────────────────────────────────────────────────
const ERR_PROGRAM_CD_DUPLICATE = 'ADM000006'; // pgmCd already exists
const ERR_PROGRAM_NOT_FOUND = 'ADM000007';    // program not found
const ERR_PARENT_NOT_MENU = 'ADM000008';      // parent must be MENU type
const ERR_ROLE_AUTH_EXISTS = 'ADM000011';     // role-auth refs prevent deletion
const ERR_EMPTY_LIST = 'COM000008';           // list must not be empty

@Injectable()
export class ProgramsService {
  constructor(private readonly qf: QueryFactory) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getProgramList(dto: SearchProgramDto): Promise<ProgramListDto> {
    // Build the recursive CTE base — filter on the root anchor only when a
    // specific pgmId is requested; other filters are applied to the full result.
    const cte = `
      WITH RECURSIVE ProgramTree AS (
        SELECT
          pgm_id, pgm_cd, pgm_nm, pgm_tp_cd, prnt_pgm_id,
          dsp_order, pgm_rmk, use_flg, upd_dt, upd_usr_id,
          1 AS level,
          CAST(pgm_id AS text) AS tree_key,
          LPAD(CAST(dsp_order AS TEXT), 3, '0') AS tree_path
        FROM com_pgm
        WHERE prnt_pgm_id IS NULL
        UNION ALL
        SELECT
          c.pgm_id, c.pgm_cd, c.pgm_nm, c.pgm_tp_cd, c.prnt_pgm_id,
          c.dsp_order, c.pgm_rmk, c.use_flg, c.upd_dt, c.upd_usr_id,
          p.level + 1,
          p.tree_key || '-' || CAST(c.pgm_id AS text),
          p.tree_path || '-' || LPAD(CAST(c.dsp_order AS TEXT), 3, '0')
        FROM com_pgm c
        INNER JOIN ProgramTree p ON c.prnt_pgm_id = p.pgm_id
      )
      SELECT * FROM ProgramTree
    `;

    const rows = await this.qf
      .raw<Record<string, unknown>>(cte)
      .andWhere('pgm_id = :pgmId', { pgmId: dto.pgmId || undefined })
      .andWhere('pgm_cd ILIKE :pgmCd', { pgmCd: dto.pgmCd ? `%${dto.pgmCd}%` : undefined })
      .andWhere('pgm_nm ILIKE :pgmNm', { pgmNm: dto.pgmNm ? `%${dto.pgmNm}%` : undefined })
      .andWhere('pgm_tp_cd = :pgmTpCd', { pgmTpCd: dto.pgmTpCd || undefined })
      .andWhere('use_flg = :useFlg', { useFlg: dto.useFlg !== undefined ? dto.useFlg : undefined })
      .orderBy('tree_path', 'ASC')
      .execute();

    const programList: ProgramDto[] = rows.map((r) => ({
      pgmId: r['pgm_id'] as string,
      pgmCd: r['pgm_cd'] as string,
      pgmNm: r['pgm_nm'] as string,
      pgmTpCd: r['pgm_tp_cd'] as string,
      prntPgmId: r['prnt_pgm_id'] as string,
      dspOrder: r['dsp_order'] as number,
      pgmRmk: r['pgm_rmk'] as string,
      useFlg: r['use_flg'] as boolean,
      level: r['level'] as number,
      treeKey: r['tree_key'] as string,
      treePath: r['tree_path'] as string,
    }));

    return ProgramListDto.of(programList, programList.length);
  }

  async getProgram(dto: SearchProgramDto): Promise<ProgramDto | null> {
    if (!dto.pgmId && !dto.pgmCd) {
      throw new BizException('PGM000001', 'ERROR', 'pgmId or pgmCd is required');
    }

    const chain = this.qf.select(Program, 'pgm');
    chain.getQueryBuilder().leftJoinAndSelect('pgm.permList', 'perm');

    if (dto.pgmId) {
      chain.whereStrict('pgm.pgmId = :pgmId', { pgmId: dto.pgmId });
    } else {
      chain.whereStrict('pgm.pgmCd = :pgmCd', { pgmCd: dto.pgmCd });
    }

    const program = await chain.getOne();
    if (!program) return null;

    return this.mapProgramToDto(program);
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async insertProgram(dto: ProgramDto): Promise<ProgramDto> {
    // 1. Unique pgmCd check (read outside transaction)
    const existing = await this.qf.findOne(Program, { pgmCd: dto.pgmCd });
    if (existing) {
      throw new BizException(ERR_PROGRAM_CD_DUPLICATE, 'ERROR');
    }

    // 2. Parent validation for UI type (read outside transaction)
    if (dto.pgmTpCd === 'UI') {
      await this.validateParentIsMenu(dto.prntPgmId);
    }

    let pgmId!: string;

    await this.qf.transaction(async (tx) => {
      // 3. Generate PK
      pgmId = await tx.genId('PGM', 'seq_pgm');

      // 4. Persist program
      await tx.insert(Program).values({
        pgmId,
        pgmCd: dto.pgmCd,
        pgmNm: dto.pgmNm,
        pgmTpCd: dto.pgmTpCd,
        prntPgmId: dto.prntPgmId ?? undefined,
        dspOrder: dto.dspOrder ?? 9999,
        pgmRmk: dto.pgmRmk,
        useFlg: dto.useFlg ?? true,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      }).execute();

      // 5. Auto-insert VIEW permission
      await this.insertViewPermission(tx, pgmId);

      // 6. Inherit SUPERADMIN role-auths from parent
      await this.assignSuperAdminRoleInheritance(tx, pgmId, dto.prntPgmId);
    });

    const saved = await this.qf
      .select(Program, 'pgm')
      .getQueryBuilder()
      .leftJoinAndSelect('pgm.permList', 'perm')
      .where('pgm.pgmId = :pgmId', { pgmId })
      .getOne();

    return this.mapProgramToDto(saved)!;
  }

  async updateProgram(dto: ProgramDto): Promise<ProgramDto> {
    const program = await this.qf.findOneOrFail(Program, { pgmId: dto.pgmId });

    // Parent validation when changing to / staying as UI type
    const targetType = dto.pgmTpCd ?? program.pgmTpCd;
    const targetParent = dto.prntPgmId !== undefined ? dto.prntPgmId : program.prntPgmId;
    if (targetType === 'UI') {
      await this.validateParentIsMenu(targetParent);
    }

    const updates: Partial<Program> = { updatedBy: 'SYSTEM' };
    if (dto.pgmCd !== undefined) updates.pgmCd = dto.pgmCd;
    if (dto.pgmNm !== undefined) updates.pgmNm = dto.pgmNm;
    if (dto.pgmTpCd !== undefined) updates.pgmTpCd = dto.pgmTpCd;
    if (dto.prntPgmId !== undefined) updates.prntPgmId = dto.prntPgmId;
    if (dto.dspOrder !== undefined) updates.dspOrder = dto.dspOrder;
    if (dto.pgmRmk !== undefined) updates.pgmRmk = dto.pgmRmk;
    if (dto.useFlg !== undefined) updates.useFlg = dto.useFlg;

    await this.qf.transaction(async (tx) => {
      await tx.update(Program).where({ pgmId: program.pgmId }).set(updates as any).execute();
    });

    const updated = await this.qf
      .select(Program, 'pgm')
      .getQueryBuilder()
      .leftJoinAndSelect('pgm.permList', 'perm')
      .where('pgm.pgmId = :pgmId', { pgmId: program.pgmId })
      .getOne();

    return this.mapProgramToDto(updated)!;
  }

  async deletePrograms(list: ProgramDto[]): Promise<void> {
    if (!list || list.length === 0) {
      throw new BizException(ERR_EMPTY_LIST, 'ERROR');
    }

    for (const dto of list) {
      // Guard: any role-auth referencing this program?
      const authRows = await this.qf
        .select(RoleAuth, 'ra')
        .whereStrict('ra.pgmId = :pgmId', { pgmId: dto.pgmId })
        .getManyAndCount();
      if (authRows[1] > 0) {
        throw new BizException(ERR_ROLE_AUTH_EXISTS, 'ERROR');
      }
    }

    await this.qf.transaction(async (tx) => {
      for (const dto of list) {
        // Delete all permissions first (role-auths already checked above)
        await tx.delete(Permission).where({ pgmId: dto.pgmId }).execute();
        // Delete the program
        await tx.delete(Program).where({ pgmId: dto.pgmId }).execute();
      }
    });
  }

  // ─── Permission operations ─────────────────────────────────────────────────

  async getPermissionByProgram(dto: SearchProgramDto): Promise<PermissionDto[]> {
    if (!dto.pgmId) {
      throw new BizException('PGM000002', 'ERROR', 'pgmId is required');
    }

    const permissions = await this.qf
      .select(Permission, 'p')
      .whereStrict('p.pgmId = :pgmId', { pgmId: dto.pgmId })
      .getMany();

    return permissions.map((p) => this.mapPermissionToDto(p));
  }

  async savePermissionByProgram(list: PermissionDto[]): Promise<void> {
    if (!list || list.length === 0) {
      throw new BizException(ERR_EMPTY_LIST, 'ERROR');
    }

    await this.qf.transaction(async (tx) => {
      for (const dto of list) {
        switch (dto.procFlag) {
          case 'D':
            await this.deletePermission(tx, dto.permId);
            break;

          case 'I':
            await this.insertPermission(tx, dto);
            break;

          case 'U':
            await this.updatePermission(tx, dto);
            break;

          default:
            throw new BizException('COM000009', 'ERROR', `Unknown procFlag: ${dto.procFlag}`);
        }
      }
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async validateParentIsMenu(prntPgmId: string | null | undefined): Promise<void> {
    if (!prntPgmId) {
      throw new BizException(ERR_PROGRAM_NOT_FOUND, 'ERROR');
    }

    const parent = await this.qf.findOne(Program, { pgmId: prntPgmId });
    if (!parent) {
      throw new BizException(ERR_PROGRAM_NOT_FOUND, 'ERROR');
    }
    if (parent.pgmTpCd !== 'MENU') {
      throw new BizException(ERR_PARENT_NOT_MENU, 'ERROR');
    }
  }

  private async insertViewPermission(tx: TransactionContext, pgmId: string): Promise<void> {
    const permId = await tx.genId('PERM', 'seq_perm');
    await tx.insert(Permission).values({
      permId,
      permCd: VIEW_PERMISSION,
      permNm: VIEW_PERMISSION_NAME,
      pgmId,
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    }).execute();
  }

  /**
   * Finds all SUPERADMIN role-auths on the parent program and replicates them
   * on the newly created child program (using the child's VIEW permission).
   */
  private async assignSuperAdminRoleInheritance(
    tx: TransactionContext,
    newPgmId: string,
    prntPgmId?: string | null,
  ): Promise<void> {
    if (!prntPgmId) return;

    // Find SUPERADMIN roles
    const superAdminRoles = await tx.select(Role, 'r')
      .whereStrict('r.roleCd = :roleCd', { roleCd: SUPERADMIN_ROLE })
      .getMany();
    if (!superAdminRoles.length) return;

    const superAdminRoleIds = superAdminRoles.map((r) => r.roleId);

    // Find existing role-auths on the parent program for those SUPERADMIN roles
    const parentAuths = await tx.select(RoleAuth, 'ra')
      .whereStrict('ra.pgmId = :pgmId', { pgmId: prntPgmId })
      .whereStrict('ra.roleId IN (:...roleIds)', { roleIds: superAdminRoleIds })
      .getMany();

    if (!parentAuths.length) return;

    // Fetch the VIEW permission we just created for the new program
    const viewPerm = await tx.findOne(Permission, { pgmId: newPgmId, permCd: VIEW_PERMISSION });
    if (!viewPerm) return;

    // Deduplicate by roleId — one VIEW auth per SUPERADMIN role
    const seenRoles = new Set<string>();

    for (const auth of parentAuths) {
      if (seenRoles.has(auth.roleId)) continue;
      seenRoles.add(auth.roleId);

      await tx.insert(RoleAuth).values({
        roleId: auth.roleId,
        pgmId: newPgmId,
        permId: viewPerm.permId,
        activeYn: true,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      }).execute();
    }
  }

  private async deletePermission(tx: TransactionContext, permId: string | undefined): Promise<void> {
    if (!permId) throw new BizException('PGM000003', 'ERROR', 'permId is required for delete');
    // Cascade: delete role-auths referencing this permission first
    await tx.delete(RoleAuth).where({ permId }).execute();
    await tx.delete(Permission).where({ permId }).execute();
  }

  private async insertPermission(tx: TransactionContext, dto: PermissionDto): Promise<void> {
    const permId = await tx.genId('PERM', 'seq_perm');
    await tx.insert(Permission).values({
      permId,
      permCd: dto.permCd,
      permNm: dto.permNm,
      pgmId: dto.pgmId,
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    }).execute();

    // Inherit SUPERADMIN role-auth for this permission if parent program has it
    await this.assignSuperAdminPermissionInheritance(tx, dto.pgmId, permId);
  }

  /**
   * When a new non-VIEW permission is inserted into a program that already has
   * SUPERADMIN role-auths, we add a matching role-auth for the new permission.
   */
  private async assignSuperAdminPermissionInheritance(
    tx: TransactionContext,
    pgmId: string | undefined,
    newPermId: string,
  ): Promise<void> {
    if (!pgmId) return;

    const superAdminRoles = await tx.select(Role, 'r')
      .whereStrict('r.roleCd = :roleCd', { roleCd: SUPERADMIN_ROLE })
      .getMany();
    if (!superAdminRoles.length) return;

    const superAdminRoleIds = superAdminRoles.map((r) => r.roleId);

    const existingAuths = await tx.select(RoleAuth, 'ra')
      .whereStrict('ra.pgmId = :pgmId', { pgmId })
      .whereStrict('ra.roleId IN (:...roleIds)', { roleIds: superAdminRoleIds })
      .getMany();

    const seenRoles = new Set<string>();

    for (const auth of existingAuths) {
      if (seenRoles.has(auth.roleId)) continue;
      seenRoles.add(auth.roleId);

      await tx.insert(RoleAuth).values({
        roleId: auth.roleId,
        pgmId,
        permId: newPermId,
        activeYn: true,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      }).execute();
    }
  }

  private async updatePermission(tx: TransactionContext, dto: PermissionDto): Promise<void> {
    const updates: Partial<Permission> = { updatedBy: 'SYSTEM' };
    if (dto.permCd !== undefined) updates.permCd = dto.permCd;
    if (dto.permNm !== undefined) updates.permNm = dto.permNm;

    await tx.update(Permission).where({ permId: dto.permId }).set(updates as any).execute();
  }

  // ─── Mapping helpers ───────────────────────────────────────────────────────

  private mapProgramToDto(program: Program | null): ProgramDto | null {
    if (!program) return null;

    const dto: ProgramDto = {
      pgmId: program.pgmId,
      pgmCd: program.pgmCd,
      pgmNm: program.pgmNm,
      pgmTpCd: program.pgmTpCd,
      prntPgmId: program.prntPgmId,
      dspOrder: program.dspOrder,
      pgmRmk: program.pgmRmk,
      useFlg: program.useFlg,
    };

    if (program.permList) {
      dto.permList = program.permList.map((p) => this.mapPermissionToDto(p));
    }

    return dto;
  }

  private mapPermissionToDto(perm: Permission): PermissionDto {
    return {
      permId: perm.permId,
      permCd: perm.permCd,
      permNm: perm.permNm,
      pgmId: perm.pgmId,
    };
  }
}
