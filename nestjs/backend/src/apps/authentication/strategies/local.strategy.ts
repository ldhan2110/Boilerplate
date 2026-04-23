import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'username' });
  }

  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new BizException('AUT000003', 'ERROR', 'Invalid credentials');
    }
    return user;
  }
}
