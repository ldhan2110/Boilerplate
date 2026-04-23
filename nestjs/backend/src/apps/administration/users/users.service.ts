import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@infra/database/entities/administration';
import { SuccessDto } from '@infra/common/dtos/success.dto';
import { QueryFactory } from '@infra/database/query-factory';
import {
  ChangeUserInfoDto,
  SearchUserDto,
  UserInfoDto,
  UserInfoListDto,
} from './dto';

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

@Injectable()
export class UsersService {
  private readonly defaultPassword: string;

  constructor(
    private readonly config: ConfigService,
    private readonly qf: QueryFactory,
  ) {
    this.defaultPassword = config.get<string>('DEFAULT_PASSWORD', 'Password@123');
  }

  // ---------------------------------------------------------------------------
  // Core auth helpers (used by AuthService / strategies)
  // ---------------------------------------------------------------------------

  findByUsrId(usrId: string): Promise<User | null> {
    return this.qf.findOne(User, { usrId });
  }

  findById(usrId: string): Promise<User | null> {
    return this.qf.findOne(User, { usrId });
  }

  async create(data: Partial<User>): Promise<User> {
    const hashed = await bcrypt.hash(data.usrPwd!, 10);
    let created: User | undefined;

    await this.qf.transaction(async (tx) => {
      const usrId = await tx.genId('USR', 'seq_usr');
      created = await tx.insert(User).values({
        ...data,
        usrId,
        usrPwd: hashed,
      }).returning<User>().execute();
    });

    return created!;
  }

  // ---------------------------------------------------------------------------
  // Admin: list / get
  // ---------------------------------------------------------------------------

  async getListUserInfo(dto: SearchUserDto): Promise<UserInfoListDto> {
    const { usrId, usrNm, pagination } = dto;

    const columns = [
      'u.usrId   AS "usrId"',
      'u.usrNm   AS "usrNm"',
      'u.usrEml  AS "usrEml"',
      'u.usrPhn  AS "usrPhn"',
      'u.usrAddr AS "usrAddr"',
      'u.usrDesc AS "usrDesc"',
      'u.usrFileId AS "usrFileId"',
      'u.roleId  AS "roleId"',
      'u.roleNm  AS "roleNm"',
      'u.langVal AS "langVal"',
      'u.sysModVal AS "sysModVal"',
      'u.dtFmtVal  AS "dtFmtVal"',
      'u.sysColrVal AS "sysColrVal"',
      'u.useFlg  AS "useFlg"',
    ];

    const [raw, total] = await this.qf
      .select(User, 'u', columns)
      .andWhere('u.usrId ILIKE :usrId', { usrId: usrId ? `%${usrId}%` : undefined })
      .andWhere('u.usrNm ILIKE :usrNm', { usrNm: usrNm ? `%${usrNm}%` : undefined })
      .paginate(pagination)
      .getRawManyAndCount<UserInfoDto>();

    return { userInfo: raw, total };
  }

  async getUserInfo(dto: SearchUserDto): Promise<UserInfoDto | null> {
    const { usrId } = dto;
    if (!usrId) return null;

    const columns = [
      'u.usrId   AS "usrId"',
      'u.usrNm   AS "usrNm"',
      'u.usrEml  AS "usrEml"',
      'u.usrPhn  AS "usrPhn"',
      'u.usrAddr AS "usrAddr"',
      'u.usrDesc AS "usrDesc"',
      'u.usrFileId AS "usrFileId"',
      'u.roleId  AS "roleId"',
      'u.roleNm  AS "roleNm"',
      'u.langVal AS "langVal"',
      'u.sysModVal AS "sysModVal"',
      'u.dtFmtVal  AS "dtFmtVal"',
      'u.sysColrVal AS "sysColrVal"',
      'u.useFlg  AS "useFlg"',
    ];

    const raw = await this.qf
      .select(User, 'u', columns)
      .where('u.usrId = :usrId', { usrId })
      .getRawOne<UserInfoDto>();

    return raw ?? null;
  }

  // ---------------------------------------------------------------------------
  // Admin: create / update
  // ---------------------------------------------------------------------------

  async createUser(dto: UserInfoDto): Promise<SuccessDto> {
    if (dto.usrId) {
      const existing = await this.qf.findOne(User, { usrId: dto.usrId });
      if (existing) {
        throw new BadRequestException('ADM000001');
      }
    }

    const hashed = await bcrypt.hash(this.defaultPassword, 10);

    await this.qf.transaction(async (tx) => {
      const usrId = await tx.genId('USR', 'seq_usr');

      await tx.insert(User).values({
        ...dto,
        usrId,
        usrPwd: hashed,
      }).execute();
    });

    return SuccessDto.of(true, 1);
  }

  async updateUser(dto: UserInfoDto): Promise<SuccessDto> {
    const { usrId, ...rest } = dto;
    const user = await this.qf.findOne(User, { usrId });
    if (!user) {
      throw new BadRequestException('ADM000002');
    }

    await this.qf.transaction(async (tx) => {
      await tx.update(User).where({ usrId: usrId! }).set(rest as Partial<User>).execute();
    });

    return SuccessDto.of(true, 1);
  }

  // ---------------------------------------------------------------------------
  // Admin: change user info (profile + password + avatar)
  // ---------------------------------------------------------------------------

  async changeUserInfo(dto: ChangeUserInfoDto): Promise<SuccessDto> {
    const user = await this.qf.findOneOrFail(User, { usrId: dto.usrId });

    const updates: Partial<User> = {};

    // Password change block
    if (dto.newPassword) {
      if (!dto.oldPassword) {
        throw new BadRequestException('Old password is required');
      }
      const isMatch = await bcrypt.compare(dto.oldPassword, user.usrPwd);
      if (!isMatch) {
        throw new UnauthorizedException('Old password is incorrect');
      }
      if (dto.newPassword !== dto.confirmNewPassword) {
        throw new BadRequestException('New passwords do not match');
      }
      if (!PASSWORD_POLICY.test(dto.newPassword)) {
        throw new BadRequestException(
          'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character',
        );
      }
      updates.usrPwd = await bcrypt.hash(dto.newPassword, 10);
    }

    // Avatar (file) update
    if (dto.usrFileId !== undefined) {
      updates.usrFileId = dto.usrFileId || '';
    }

    // Other profile fields
    if (dto.usrNm !== undefined) updates.usrNm = dto.usrNm;
    if (dto.usrEml !== undefined) updates.usrEml = dto.usrEml;
    if (dto.usrPhn !== undefined) updates.usrPhn = dto.usrPhn;
    if (dto.usrAddr !== undefined) updates.usrAddr = dto.usrAddr;
    if (dto.usrDesc !== undefined) updates.usrDesc = dto.usrDesc;

    await this.qf.transaction(async (tx) => {
      await tx.update(User).where({ usrId: dto.usrId! }).set(updates).execute();
    });

    return SuccessDto.of(true, 1);
  }

  // ---------------------------------------------------------------------------
  // Admin: reset passwords
  // ---------------------------------------------------------------------------

  async resetUserPassword(users: UserInfoDto[]): Promise<SuccessDto> {
    if (!users || users.length === 0) {
      throw new BadRequestException('ADM000003');
    }

    const hashed = await bcrypt.hash(this.defaultPassword, 10);

    await this.qf.transaction(async (tx) => {
      for (const { usrId } of users) {
        await tx.update(User).where({ usrId: usrId! }).set({ usrPwd: hashed }).execute();
      }
    });

    return SuccessDto.of(true, users.length);
  }

  // ---------------------------------------------------------------------------
  // Admin: save UI settings
  // ---------------------------------------------------------------------------

  async saveUserSetting(dto: UserInfoDto): Promise<SuccessDto> {
    const user = await this.qf.findOne(User, { usrId: dto.usrId });
    if (!user) {
      throw new BadRequestException('ADM000002');
    }

    const updates: Partial<User> = {};
    if (dto.langVal !== undefined) updates.langVal = dto.langVal;
    if (dto.sysModVal !== undefined) updates.sysModVal = dto.sysModVal;
    if (dto.dtFmtVal !== undefined) updates.dtFmtVal = dto.dtFmtVal;
    if (dto.sysColrVal !== undefined) updates.sysColrVal = dto.sysColrVal;

    await this.qf.transaction(async (tx) => {
      await tx.update(User).where({ usrId: dto.usrId! }).set(updates).execute();
    });

    return SuccessDto.of(true, 1);
  }
}
