import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isValid = await bcrypt.compare(pass, user.credentials);
    if (!isValid) {
      throw new UnauthorizedException();
    }
    const { credentials, ...result } = user;
    return result;
  }

  private async getTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessExpires =
      (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any;

    const refreshExpires =
      (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET')!,
      expiresIn: accessExpires, // als any gecastet
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: refreshExpires, // als any gecastet
    });

    return { accessToken, refreshToken };
  }

  async login(user: any) {
    const tokens = await this.getTokens(user.id, user.email);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const tokens = await this.getTokens(user.id, user.email);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}
