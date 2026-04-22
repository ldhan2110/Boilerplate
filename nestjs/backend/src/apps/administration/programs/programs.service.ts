import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Permission,
  Program,
  Role,
  RoleAuth,
} from '@infra/database/entities/administration';
import { generateId } from '@infra/common/utils/id-generator.util';
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
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(RoleAuth)
    private readonly roleAuthRepo: Repository<RoleAuth>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly dataSource: DataSource,
  ) {}

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

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.pgmId) {
      conditions.push(`pgm_id = $${idx++}`);
      params.push(dto.pgmId);
    }
    if (dto.pgmCd) {
      conditions.push(`pgm_cd ILIKE $${idx++}`);
      params.push(`%${dto.pgmCd}%`);
    }
    if (dto.pgmNm) {
      conditions.push(`pgm_nm ILIKE $${idx++}`);
      params.push(`%${dto.pgmNm}%`);
    }
    if (dto.pgmTpCd) {
      conditions.push(`pgm_tp_cd = $${idx++}`);
      params.push(dto.pgmTpCd);
    }
    if (dto.useFlg !== undefined) {
      conditions.push(`use_flg = $${idx++}`);
      params.push(dto.useFlg);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `${cte} ${whereClause} ORDER BY tree_path`;

    const rows: Record<string, unknown>[] = await this.dataSource.query(sql, params);

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
      throw new BadRequestException('pgmId or pgmCd is required');
    }

    const where: Partial<Program> = {};
    if (dto.pgmId) where.pgmId = dto.pgmId;
    if (dto.pgmCd) where.pgmCd = dto.pgmCd;

    const program = await this.programRepo.findOne({
      where,
      relations: ['permList'],
    });

    if (!program) return null;

    return this.mapProgramToDto(program);
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async insertProgram(dto: ProgramDto): Promise<ProgramDto> {
    // 1. Unique pgmCd check
    const existing = await this.programRepo.findOne({ where: { pgmCd: dto.pgmCd } });
    if (existing) {
      throw new BadRequestException(ERR_PROGRAM_CD_DUPLICATE);
    }

    // 2. Parent validation for UI type
    if (dto.pgmTpCd === 'UI') {
      await this.validateParentIsMenu(dto.prntPgmId);
    }

    // 3. Generate PK
    const pgmId = await generateId(this.dataSource, 'PGM', 'seq_pgm');

    // 4. Persist program
    const program = this.programRepo.create({
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
    });
    await this.programRepo.save(program);

    // 5. Auto-insert VIEW permission
    await this.insertViewPermission(pgmId);

    // 6. Inherit SUPERADMIN role-auths from parent
    await this.assignSuperAdminRoleInheritance(pgmId, dto.prntPgmId);

    const saved = await this.programRepo.findOne({ where: { pgmId }, relations: ['permList'] });
    return this.mapProgramToDto(saved)!;
  }

  async updateProgram(dto: ProgramDto): Promise<ProgramDto> {
    const program = await this.programRepo.findOne({ where: { pgmId: dto.pgmId } });
    if (!program) {
      throw new NotFoundException(ERR_PROGRAM_NOT_FOUND);
    }

    // Parent validation when changing to / staying as UI type
    const targetType = dto.pgmTpCd ?? program.pgmTpCd;
    const targetParent = dto.prntPgmId !== undefined ? dto.prntPgmId : program.prntPgmId;
    if (targetType === 'UI') {
      await this.validateParentIsMenu(targetParent);
    }

    if (dto.pgmCd !== undefined) program.pgmCd = dto.pgmCd;
    if (dto.pgmNm !== undefined) program.pgmNm = dto.pgmNm;
    if (dto.pgmTpCd !== undefined) program.pgmTpCd = dto.pgmTpCd;
    if (dto.prntPgmId !== undefined) program.prntPgmId = dto.prntPgmId;
    if (dto.dspOrder !== undefined) program.dspOrder = dto.dspOrder;
    if (dto.pgmRmk !== undefined) program.pgmRmk = dto.pgmRmk;
    if (dto.useFlg !== undefined) program.useFlg = dto.useFlg;
    program.updatedBy = 'SYSTEM';

    await this.programRepo.save(program);

    const updated = await this.programRepo.findOne({
      where: { pgmId: program.pgmId },
      relations: ['permList'],
    });
    return this.mapProgramToDto(updated)!;
  }

  async deletePrograms(list: ProgramDto[]): Promise<void> {
    if (!list || list.length === 0) {
      throw new BadRequestException(ERR_EMPTY_LIST);
    }

    for (const dto of list) {
      // Guard: any role-auth referencing this program?
      const authCount = await this.roleAuthRepo.count({ where: { pgmId: dto.pgmId } });
      if (authCount > 0) {
        throw new BadRequestException(ERR_ROLE_AUTH_EXISTS);
      }

      // Delete all permissions first (and their role-auths — already checked above)
      await this.permissionRepo.delete({ pgmId: dto.pgmId });

      // Delete the program
      await this.programRepo.delete({ pgmId: dto.pgmId });
    }
  }

  // ─── Permission operations ─────────────────────────────────────────────────

  async getPermissionByProgram(dto: SearchProgramDto): Promise<PermissionDto[]> {
    if (!dto.pgmId) {
      throw new BadRequestException('pgmId is required');
    }

    const permissions = await this.permissionRepo.find({ where: { pgmId: dto.pgmId } });
    return permissions.map((p) => this.mapPermissionToDto(p));
  }

  async savePermissionByProgram(list: PermissionDto[]): Promise<void> {
    if (!list || list.length === 0) {
      throw new BadRequestException(ERR_EMPTY_LIST);
    }

    for (const dto of list) {
      switch (dto.procFlag) {
        case 'D':
          await this.deletePermission(dto.permId);
          break;

        case 'I':
          await this.insertPermission(dto);
          break;

        case 'U':
          await this.updatePermission(dto);
          break;

        default:
          throw new BadRequestException(`Unknown procFlag: ${dto.procFlag}`);
      }
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async validateParentIsMenu(prntPgmId: string | null | undefined): Promise<void> {
    if (!prntPgmId) {
      throw new BadRequestException(ERR_PROGRAM_NOT_FOUND);
    }

    const parent = await this.programRepo.findOne({ where: { pgmId: prntPgmId } });
    if (!parent) {
      throw new NotFoundException(ERR_PROGRAM_NOT_FOUND);
    }
    if (parent.pgmTpCd !== 'MENU') {
      throw new BadRequestException(ERR_PARENT_NOT_MENU);
    }
  }

  private async insertViewPermission(pgmId: string): Promise<Permission> {
    const permId = await generateId(this.dataSource, 'PERM', 'seq_perm');
    const viewPerm = this.permissionRepo.create({
      permId,
      permCd: VIEW_PERMISSION,
      permNm: VIEW_PERMISSION_NAME,
      pgmId,
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    });
    return this.permissionRepo.save(viewPerm);
  }

  /**
   * Finds all SUPERADMIN role-auths on the parent program and replicates them
   * on the newly created child program (using the child's VIEW permission).
   */
  private async assignSuperAdminRoleInheritance(
    newPgmId: string,
    prntPgmId?: string | null,
  ): Promise<void> {
    if (!prntPgmId) return;

    // Find SUPERADMIN roles
    const superAdminRoles = await this.roleRepo.find({
      where: { roleCd: SUPERADMIN_ROLE },
    });
    if (!superAdminRoles.length) return;

    const superAdminRoleIds = superAdminRoles.map((r) => r.roleId);

    // Find existing role-auths on the parent program for those SUPERADMIN roles
    const parentAuths = await this.roleAuthRepo
      .createQueryBuilder('ra')
      .where('ra.pgm_id = :pgmId', { pgmId: prntPgmId })
      .andWhere('ra.role_id IN (:...roleIds)', { roleIds: superAdminRoleIds })
      .getMany();

    if (!parentAuths.length) return;

    // Fetch the VIEW permission we just created for the new program
    const viewPerm = await this.permissionRepo.findOne({
      where: { pgmId: newPgmId, permCd: VIEW_PERMISSION },
    });
    if (!viewPerm) return;

    // Deduplicate by roleId — one VIEW auth per SUPERADMIN role
    const seenRoles = new Set<string>();
    const newAuths: RoleAuth[] = [];

    for (const auth of parentAuths) {
      if (seenRoles.has(auth.roleId)) continue;
      seenRoles.add(auth.roleId);

      const roleAuth = this.roleAuthRepo.create({
        roleId: auth.roleId,
        pgmId: newPgmId,
        permId: viewPerm.permId,
        activeYn: true,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      });
      newAuths.push(roleAuth);
    }

    if (newAuths.length) {
      await this.roleAuthRepo.save(newAuths);
    }
  }

  private async deletePermission(permId: string | undefined): Promise<void> {
    if (!permId) throw new BadRequestException('permId is required for delete');
    // Cascade: delete role-auths referencing this permission first
    await this.roleAuthRepo.delete({ permId });
    await this.permissionRepo.delete({ permId });
  }

  private async insertPermission(dto: PermissionDto): Promise<void> {
    const permId = await generateId(this.dataSource, 'PERM', 'seq_perm');
    const perm = this.permissionRepo.create({
      permId,
      permCd: dto.permCd,
      permNm: dto.permNm,
      pgmId: dto.pgmId,
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    });
    await this.permissionRepo.save(perm);

    // Inherit SUPERADMIN role-auth for this permission if parent program has it
    await this.assignSuperAdminPermissionInheritance(dto.pgmId, permId);
  }

  /**
   * When a new non-VIEW permission is inserted into a program that already has
   * SUPERADMIN role-auths, we add a matching role-auth for the new permission.
   */
  private async assignSuperAdminPermissionInheritance(
    pgmId: string | undefined,
    newPermId: string,
  ): Promise<void> {
    if (!pgmId) return;
    const superAdminRoles = await this.roleRepo.find({ where: { roleCd: SUPERADMIN_ROLE } });
    if (!superAdminRoles.length) return;

    const superAdminRoleIds = superAdminRoles.map((r) => r.roleId);

    const existingAuths = await this.roleAuthRepo
      .createQueryBuilder('ra')
      .where('ra.pgm_id = :pgmId', { pgmId })
      .andWhere('ra.role_id IN (:...roleIds)', { roleIds: superAdminRoleIds })
      .getMany();

    const seenRoles = new Set<string>();
    const newAuths: RoleAuth[] = [];

    for (const auth of existingAuths) {
      if (seenRoles.has(auth.roleId)) continue;
      seenRoles.add(auth.roleId);

      newAuths.push(
        this.roleAuthRepo.create({
          roleId: auth.roleId,
          pgmId,
          permId: newPermId,
          activeYn: true,
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        }),
      );
    }

    if (newAuths.length) {
      await this.roleAuthRepo.save(newAuths);
    }
  }

  private async updatePermission(dto: PermissionDto): Promise<void> {
    const perm = await this.permissionRepo.findOne({ where: { permId: dto.permId } });
    if (!perm) throw new NotFoundException(`Permission ${dto.permId} not found`);

    if (dto.permCd !== undefined) perm.permCd = dto.permCd;
    if (dto.permNm !== undefined) perm.permNm = dto.permNm;
    perm.updatedBy = 'SYSTEM';

    await this.permissionRepo.save(perm);
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
