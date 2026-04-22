import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { User } from '@infra/database/entities/administration';
import { generateId } from '@infra/common/utils/id-generator.util';
import { SuccessDto } from '@infra/common/dtos/success.dto';
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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    this.defaultPassword = config.get<string>('DEFAULT_PASSWORD', 'Password@123');
  }

  // ---------------------------------------------------------------------------
  // Core auth helpers (used by AuthService / strategies)
  // ---------------------------------------------------------------------------

  findByUsrId(usrId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { usrId } });
  }

  findById(usrId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { usrId } });
  }

  async create(data: Partial<User>): Promise<User> {
    const hashed = await bcrypt.hash(data.usrPwd!, 10);
    const usrId = await generateId(this.dataSource, 'USR', 'seq_usr');
    const user = this.usersRepository.create({ ...data, usrId, usrPwd: hashed });
    return this.usersRepository.save(user);
  }

  // ---------------------------------------------------------------------------
  // Admin: list / get
  // ---------------------------------------------------------------------------

  async getListUserInfo(dto: SearchUserDto): Promise<UserInfoListDto> {
    const { usrId, usrNm, pagination } = dto;
    const pageSize = pagination?.pageSize ?? 10;
    const current = pagination?.current ?? 1;

    const qb = this.dataSource
      .createQueryBuilder(User, 'u')
      .select([
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
      ])
      .where('1=1');

    if (usrId) {
      qb.andWhere('u.usrId ILIKE :usrId', { usrId: `%${usrId}%` });
    }
    if (usrNm) {
      qb.andWhere('u.usrNm ILIKE :usrNm', { usrNm: `%${usrNm}%` });
    }

    const total = await qb.getCount();
    const raw = await qb
      .offset((current - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<UserInfoDto>();

    return { userInfo: raw, total };
  }

  async getUserInfo(dto: SearchUserDto): Promise<UserInfoDto | null> {
    const { usrId } = dto;
    if (!usrId) return null;

    const raw = await this.dataSource
      .createQueryBuilder(User, 'u')
      .select([
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
      ])
      .where('u.usrId = :usrId', { usrId })
      .getRawOne<UserInfoDto>();

    return raw ?? null;
  }

  // ---------------------------------------------------------------------------
  // Admin: create / update
  // ---------------------------------------------------------------------------

  async createUser(dto: UserInfoDto): Promise<SuccessDto> {
    if (dto.usrId) {
      const existing = await this.usersRepository.findOne({
        where: { usrId: dto.usrId },
      });
      if (existing) {
        throw new BadRequestException('ADM000001');
      }
    }

    const hashed = await bcrypt.hash(this.defaultPassword, 10);
    const usrId = await generateId(this.dataSource, 'USR', 'seq_usr');

    const user = this.usersRepository.create({
      ...dto,
      usrId,
      usrPwd: hashed,
    });
    await this.usersRepository.save(user);
    return SuccessDto.of(true, 1);
  }

  async updateUser(dto: UserInfoDto): Promise<SuccessDto> {
    const { usrId, ...rest } = dto;
    const user = await this.usersRepository.findOne({ where: { usrId } });
    if (!user) {
      throw new BadRequestException('ADM000002');
    }

    await this.usersRepository.update({ usrId: usrId! }, rest as Partial<User>);
    return SuccessDto.of(true, 1);
  }

  // ---------------------------------------------------------------------------
  // Admin: change user info (profile + password + avatar)
  // ---------------------------------------------------------------------------

  async changeUserInfo(dto: ChangeUserInfoDto): Promise<SuccessDto> {
    const user = await this.usersRepository.findOne({ where: { usrId: dto.usrId } });
    if (!user) {
      throw new BadRequestException('ADM000002');
    }

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

    await this.usersRepository.update({ usrId: dto.usrId! }, updates);
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

    await Promise.all(
      users.map(({ usrId }) =>
        this.usersRepository.update({ usrId: usrId! }, { usrPwd: hashed }),
      ),
    );

    return SuccessDto.of(true, users.length);
  }

  // ---------------------------------------------------------------------------
  // Admin: save UI settings
  // ---------------------------------------------------------------------------

  async saveUserSetting(dto: UserInfoDto): Promise<SuccessDto> {
    const user = await this.usersRepository.findOne({ where: { usrId: dto.usrId } });
    if (!user) {
      throw new BadRequestException('ADM000002');
    }

    const updates: Partial<User> = {};
    if (dto.langVal !== undefined) updates.langVal = dto.langVal;
    if (dto.sysModVal !== undefined) updates.sysModVal = dto.sysModVal;
    if (dto.dtFmtVal !== undefined) updates.dtFmtVal = dto.dtFmtVal;
    if (dto.sysColrVal !== undefined) updates.sysColrVal = dto.sysColrVal;

    await this.usersRepository.update({ usrId: dto.usrId! }, updates);
    return SuccessDto.of(true, 1);
  }
}
