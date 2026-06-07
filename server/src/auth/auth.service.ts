import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';

export type AuthScope = 'reader' | 'admin';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  loginReader(password: string): string {
    return this.signFor(password, process.env.READER_PASSWORD, 'reader', 'READER_PASSWORD');
  }

  loginAdmin(password: string): string {
    return this.signFor(password, process.env.ADMIN_PASSWORD, 'admin', 'ADMIN_PASSWORD');
  }

  private signFor(
    provided: string,
    expected: string | undefined,
    scope: AuthScope,
    envName: string,
  ): string {
    if (!expected) {
      throw new Error(`${envName} env var is required`);
    }
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) {
      throw new UnauthorizedException('Invalid password');
    }
    return this.jwt.sign({ scope });
  }
}
